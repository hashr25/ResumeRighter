import json
import os
from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from resume_app.services.openai_service import (
    validate_resume,
    validate_job_posting,
    validate_special_considerations,
    generate_rewritten_resume,
)
from resume_righter import settings


# Create your views here.
def index(request):
    try:
        return render(request, 'resume_app/index.html',
                      {"extra_details": settings.EXTRA_DETAILS_FOR_RESUME_GENERATION})
    except Exception as e:
        return HttpResponse(f"Error: {e}")


def validate_resume_api(request):
    if request.method == "POST":
        # Retrieve the uploaded file
        uploaded_file = request.FILES.get("resume_file")
        if not uploaded_file:
            return JsonResponse({"error": "No file uploaded"}, status=400)

        # Determine the file type from the uploaded file
        filename = uploaded_file.name
        file_extension = os.path.splitext(filename)[1].lower()  # Get file extension

        # Map extensions to file types
        file_type_map = {
            ".pdf": "pdf",
            ".docx": "docx",
            ".txt": "txt",
        }
        file_type = file_type_map.get(file_extension)
        if not file_type:
            return JsonResponse({"error": f"Unsupported file type: {file_extension}"}, status=400)

        # Validate the resume using the uploaded file and its type
        result = validate_resume(uploaded_file, file_type)
        return JsonResponse({
            "valid": result["is_valid"],
            "extracted_text": result["validated_data"],
        })

    return JsonResponse({"error": "Invalid request method."}, status=405)


def validate_job_posting_api(request):
    if request.method == "POST":
        data = json.loads(request.body)
        url = data.get("url")
        if not url:
            return JsonResponse({"error": "No URL provided."}, status=400)

        # Call the service to validate the job posting
        result = validate_job_posting(url)
        return JsonResponse({
            "valid": result["is_valid"],
            "job_posting_text": result["validated_data"],
        })

    return JsonResponse({"error": "Invalid request method."}, status=405)


def validate_special_considerations_api(request):
    if request.method == "POST":
        data = json.loads(request.body)
        text = data.get("text")
        if not text:
            return JsonResponse({"error": "No text provided."}, status=400)

        # Validate the special considerations using OpenAI
        result = validate_special_considerations(text)
        return JsonResponse({
            "valid": result["is_valid"],
            "validated_data": result["validated_data"],
        })

    return JsonResponse({"error": "Invalid request method."}, status=405)


def generate_resume_api(request):
    if request.method == "POST":
        data = json.loads(request.body)
        resume_text = data.get("resume_text")
        job_posting_text = data.get("job_posting_text")
        considerations = data.get("considerations")

        if not resume_text or not job_posting_text:
            print("Missing required input.")
            return JsonResponse({"error": "Missing required input."}, status=400)

        try:
            print("Generating rewritten resume in view...")
            # Generate the rewritten resume
            rewritten_resume = generate_rewritten_resume(resume_text, job_posting_text, considerations)

            # Serve the .docx file as a response
            response = HttpResponse(
                rewritten_resume,
                content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
            response["Content-Disposition"] = 'attachment; filename="Rewritten_Resume.docx"'
            return response
        except Exception as e:
            return JsonResponse({"error": f"Failed to generate resume: {str(e)}"}, status=500)

    return JsonResponse({"error": "Invalid request method."}, status=405)
