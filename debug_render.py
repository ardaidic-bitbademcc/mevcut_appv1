from fastapi import FastAPI
from fastapi.responses import JSONResponse
import os
import subprocess

debug_app = FastAPI()

@debug_app.get("/debug/files")
async def list_files():
    try:
        # Get current working directory
        cwd = os.getcwd()
        
        # List files in various directories
        result = {
            "cwd": cwd,
            "root_files": os.listdir("."),
            "frontend_exists": os.path.exists("frontend"),
            "backend_exists": os.path.exists("backend"),
        }
        
        if os.path.exists("frontend"):
            result["frontend_files"] = os.listdir("frontend")
            if os.path.exists("frontend/build"):
                result["frontend_build_files"] = os.listdir("frontend/build")
                if os.path.exists("frontend/build/static/js"):
                    result["js_files"] = os.listdir("frontend/build/static/js")
        
        return JSONResponse(result)
    except Exception as e:
        return JSONResponse({"error": str(e)})