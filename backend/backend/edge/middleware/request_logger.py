class RequestLoggerMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        print(f"🛰️  Incoming {request.method} request to {request.path}")
        return self.get_response(request)

