import asyncio
import websockets
import msgpack
import json
import sys
import hmac
import hashlib

# Force UTF-8 for output on Windows
sys.stdout.reconfigure(encoding='utf-8')

async def test():
    uri = "ws://127.0.0.1:8080/rpc"
    token = "Saeed2026"
    client_id = "openclaw-internal-cli"
    
    try:
        async with websockets.connect(uri, subprotocols=["v3.openclaw.rpc"]) as websocket:
            print(f"Connecting to {uri}")
            
            # Initial connect
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "connect",
                "params": {
                    "auth": { "token": token },
                    "client": { "id": client_id, "mode": "operator" }
                }
            }
            print(f"Sending Initial MessagePack Connect: {payload}")
            await websocket.send(msgpack.packb(payload))
            
            # Message loop
            async for response in websocket:
                # Handle both bytes (MsgPack) and str (JSON)
                is_bytes = isinstance(response, bytes)
                raw_hex = response.hex() if is_bytes else response.encode().hex()
                print(f"Received ({'bytes' if is_bytes else 'str'}): {raw_hex[:100]}...")
                
                try:
                    if is_bytes:
                        decoded = msgpack.unpackb(response)
                    else:
                        decoded = json.loads(response)
                except Exception as e:
                    print(f"Decode failed: {e}")
                    continue
                
                print(f"Decoded: {json.dumps(decoded, indent=2)}")
                
                # Handle Challenge
                if isinstance(decoded, dict) and decoded.get("event") == "connect.challenge":
                    nonce = decoded["payload"]["nonce"]
                    ts = decoded["payload"]["ts"]
                    
                    # v3|operator|openclaw-internal-cli|{nonce}|{ts}
                    data_to_sign = f"v3|operator|{client_id}|{nonce}|{ts}"
                    signature = hmac.new(
                        token.encode(),
                        data_to_sign.encode(),
                        hashlib.sha256
                    ).hexdigest().upper()
                    
                    response_payload = {
                        "jsonrpc": "2.0",
                        "id": 2,
                        "method": "connect",
                        "params": {
                            "auth": {
                                "token": token,
                                "signature": signature,
                                "nonce": nonce,
                                "ts": int(ts)
                            },
                            "client": {
                                "id": client_id,
                                "mode": "operator"
                            }
                        }
                    }
                    print(f"Sending Signed Handshake (MsgPack): {response_payload}")
                    await websocket.send(msgpack.packb(response_payload))
                
                # Handle Result
                if isinstance(decoded, dict):
                    if decoded.get("result"):
                        print("✅ SUCCESS: Received result!")
                        return
                    if decoded.get("error"):
                        print(f"❌ ERROR: {decoded['error']}")
                        return
                        
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test())
