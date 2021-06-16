from care.users.models import User


def get_users(user):
    queryset = User.objects.all()
    if user.is_superuser:
        pass
    elif user.user_type >= User.TYPE_VALUE_MAP["StateLabAdmin"]:
        queryset = queryset.filter(user__state=user.state)
    elif user.user_type >= User.TYPE_VALUE_MAP["DistrictLabAdmin"]:
        queryset = queryset.filter(user__district=user.district)
    else:
        queryset = queryset.filter(user=user)
    return queryset
