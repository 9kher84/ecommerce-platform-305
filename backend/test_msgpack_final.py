import asyncio
import websockets
import msgpack
import json
import sys

# Force UTF-8 for output on Windows
sys.stdout.reconfigure(encoding='utf-8')

async def test():
    uri = "ws://127.0.0.1:8080/rpc"
    # Using the subprotocol 'v3.openclaw.rpc'
    try:
        async with websockets.connect(uri, subprotocols=["v3.openclaw.rpc"]) as websocket:
            print(f"Connecting to {uri}")
            
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "connect",
                "params": {
                    "auth": { "token": "Saeed2026" }
                }
            }
            print(f"Sending: {payload}")
            await websocket.send(msgpack.packb(payload))
            
            try:
                # Wait for up to 5 seconds for a response
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"Raw response (Hex): {response.hex()}")
                
                try:
                    decoded = msgpack.unpackb(response)
                    print(f"Response (MsgPack): {json.dumps(decoded, indent=2)}")
                except Exception as e:
                    print(f"MsgPack decode failed: {e}")
                    try:
                        decoded = json.loads(response.decode())
                        print(f"Response (JSON): {json.dumps(decoded, indent=2)}")
                    except Exception as e2:
                        print(f"JSON decode failed: {e2}")
                        return
                
                if isinstance(decoded, dict):
                    if decoded.get("result"):
                        print("SUCCESS: Received result!")
                    elif decoded.get("error"):
                        print(f"ERROR: {decoded['error']}")
                    elif decoded.get("event") == "connect.challenge":
                        print("CHALLENGE received. Checking if we can bypass...")
                        # If we get a challenge, maybe the bypass is not working or we need a specific payload.
            except asyncio.TimeoutError:
                print("Timeout waiting for response")
            except websockets.exceptions.ConnectionClosed:
                print("Connection closed by server")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test())
