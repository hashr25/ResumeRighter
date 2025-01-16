"""
URL configuration for resume_righter project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from resume_app import views

urlpatterns = [
    path('', views.index, name="index"),
    path("api/validate-resume/", views.validate_resume_api, name="validate_resume_api"),
    path("api/validate-job-posting/", views.validate_job_posting_api, name="validate_job_posting_api"),
    path("api/validate-special-considerations/", views.validate_special_considerations_api,
         name="validate_special_considerations"),
    path("api/generate-resume/", views.generate_resume_api, name="generate_resume"),
    path('admin/', admin.site.urls),
]
