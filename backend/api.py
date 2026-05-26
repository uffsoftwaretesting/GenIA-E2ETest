# """Compatibility facade for the Flask REST API."""

# from backend.http.app_factory import create_app


# try:
#     app, socketio, orchestrator = create_app()
# except RuntimeError:
#     app = None
#     socketio = None
#     orchestrator = None


# if __name__ == "__main__":
#     if app is None:
#         raise RuntimeError("API dependencies are not installed in this environment.")
#     app.run(host="0.0.0.0", port=5000)

"""Compatibility facade for the Flask REST API."""

from backend.http.app_factory import create_app

# deixa o erro aparecer nos logs
app, socketio, orchestrator = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)