import asyncio
import websockets
import msgpack
import json

async def test():
    uri = "ws://127.0.0.1:8080/rpc"
    async with websockets.connect(uri, subprotocols=["v3.openclaw.rpc"]) as websocket:
        print(f"🚀 Connected to {uri}")
        
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "connect",
            "params": {
                "auth": { "token": "Saeed2026" },
                "client": { "id": "openclaw-internal-cli", "mode": "operator" }
            }
        }
        print(f"📤 Sending: {payload}")
        await websocket.send(msgpack.packb(payload))
        
        try:
            while True:
                response = await websocket.recv()
                print(f"📥 Raw response (Hex): {response.hex()}")
                
                try:
                    decoded = msgpack.unpackb(response)
                    print(f"📥 Response (MsgPack): {json.dumps(decoded, indent=2)}")
                except Exception as e:
                    print(f"⚠️ MsgPack decode failed: {e}")
                    try:
                        decoded = json.loads(response.decode())
                        print(f"📥 Response (JSON): {json.dumps(decoded, indent=2)}")
                    except Exception as e2:
                        print(f"❌ JSON decode failed: {e2}")
                        continue
                
                if isinstance(decoded, dict):
                    if decoded.get("result") or decoded.get("event") == "connect.success":
                        print("✅ SUCCESS!")
                        return
                    if decoded.get("error"):
                        print(f"❌ ERROR: {decoded['error']}")
                        return
        except websockets.exceptions.ConnectionClosed:
            print("⚠️ Connection closed by server")

if __name__ == "__main__":
    asyncio.run(test())
