from django import forms
from django.contrib.auth.models import User
from django.contrib.auth import authenticate

class CreateLoginForm(forms.Form):
    username = forms.CharField(max_length=20, widget=forms.TextInput(attrs={'id': 'id_username'}))
    password = forms.CharField(max_length=50, widget=forms.PasswordInput(attrs={'id': 'id_password'}))
    def clean(self):
    # Calls our parent (forms.Form) .clean function, gets a dictionary
    # of cleaned data as a result
        cleaned_data = super().clean()

        # Confirms that the two password fields match
        username = cleaned_data.get('username')
        password = cleaned_data.get('password')
        user = authenticate(username=username, password=password)
        if not user:
            raise forms.ValidationError("Invalid username/password")

        # We must return the cleaned data we got from our parent.
        return cleaned_data

class CreateRegisterForm(forms.Form):
    username = forms.CharField(max_length=20, widget=forms.TextInput(attrs={'id': 'id_username'}))
    password = forms.CharField(max_length=50, widget=forms.PasswordInput(attrs={'id': 'id_password'}))
    confirm_password = forms.CharField(max_length=50, widget=forms.PasswordInput(attrs={'id': 'id_confirm_password'}))
    email = forms.CharField(max_length=50, widget=forms.EmailInput(attrs={'id': 'id_email'}))
    first_name = forms.CharField(max_length=50, widget=forms.TextInput(attrs={'id': 'id_first_name'}))
    last_name = forms.CharField(max_length=50, widget=forms.TextInput(attrs={'id': 'id_last_name'}))

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data['password']
        confirm_password = cleaned_data['confirm_password']
        if password and confirm_password and password != confirm_password:
            raise forms.ValidationError("Passwords Do Not Match")
        return cleaned_data

    def clean_username(self):
        username = self.cleaned_data.get('username')
        if User.objects.filter(username__exact=username):
            raise forms.ValidationError("Username Is Already Taken")
        return username