from django.db import models
from django import forms
from django.contrib.auth.models import User

class Profile(models.Model):
    username = models.OneToOneField(User, on_delete=models.CASCADE)
    def __str__(self):
        return 'Post(id=' + str(self.id) + ')'
