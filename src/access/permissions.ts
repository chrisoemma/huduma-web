export const hasPermission = (user, permission) => {
    return user && user.permissions && user.permissions.includes(permission);
  };


