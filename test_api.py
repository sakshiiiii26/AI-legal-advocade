import urllib.request
import json

endpoints = [
    ("GET", "/analytics"),
    ("GET", "/cases"),
    ("GET", "/cases/1"),
    ("GET", "/tasks"),
    ("GET", "/clients"),
    ("GET", "/documents"),
    ("GET", "/me"),
    ("POST", "/auth/login", b'{"username":"admin@example.com","password":"StrongPass123!"}')
]

with open("broken.txt", "w") as f:
    f.write("Endpoint Test Results:\n")
    for method, path, *data in endpoints:
        req = urllib.request.Request(f"http://localhost:8000{path}", method=method)
        if data:
            req.add_header("Content-Type", "application/json")
            req.data = data[0]
        try:
            res = urllib.request.urlopen(req)
            f.write(f"{method} {path} - OK ({res.status})\n")
        except urllib.error.HTTPError as e:
            f.write(f"{method} {path} - FAILED ({e.code})\n")
        except Exception as e:
            f.write(f"{method} {path} - ERROR ({str(e)})\n")
