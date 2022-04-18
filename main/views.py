from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from main.forms import *
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from main.models import *
from django.utils import timezone, dateparse
from django.http import HttpResponse, Http404
from django.core import serializers
import json 

# Create your views here.
def home_action(request):
    if request.method == 'GET':
        print("HERE")
        form = CreateLoginForm()
        context = {
            'form': form,
            'page': "home",
        }
        return render(request, 'home.html', context)
    context = {}
    context["page"] = "home"
    return render(request, 'home.html', context)

# For the Login page
def login_action(request):
    if request.method == 'GET':
        print("HERE")
        form = CreateLoginForm()
        context = {
            'form': form,
        }
        return render(request, 'login.html', context)
    elif request.method == 'POST':
        form = CreateLoginForm(request.POST)
        context = {
            'form': form
        }

        # Validates the form.
        if not form.is_valid():
            return render(request, 'login.html', context)

        new_user = authenticate(username=form.cleaned_data['username'],
                                password=form.cleaned_data['password'])

        login(request, new_user)
        return redirect(reverse('home'))

# For the Register page
def register_action(request):
    context = {}
    if request.method == "GET":
        form = CreateRegisterForm()
        context = {
            'form' : form, 
        }
        return render(request, 'register.html', context)
    elif request.method == "POST": 
        form = CreateRegisterForm(request.POST)
        context['form'] = form 
        if not form.is_valid():
            return render(request, 'register.html', context)
        new_user = User.objects.create_user(username=form.cleaned_data['username'], email=form.cleaned_data['email'],
                                            password=form.cleaned_data['password'], first_name=form.cleaned_data['first_name'],
                                            last_name=form.cleaned_data['last_name']
                                            )
        profile = Profile()
        profile.username = new_user
        profile.save()

        new_user.save()
        new_user = authenticate(username=form.cleaned_data['username'], password=form.cleaned_data['password'])
        login(request, new_user)
        return redirect(reverse('login'))

def unity_action(request):
    return render(request, 'unity.html', {})