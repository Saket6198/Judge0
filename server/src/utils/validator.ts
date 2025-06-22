import validator from 'validator';

export const validate = (data: any) => {
    const mandatoryFields = ['name', 'emailId', 'password'];
    const isAllowed = mandatoryFields.every((k) => Object.keys(data).includes(k));

    if(!isAllowed) {
        throw new Error('Missing mandatory fields');
    }
    if(!validator.isLength(data.name, {min: 3, max: 20})) {
        throw new Error('Name must be between 3 and 20 characters');
    }
    if(!validator.isEmail(data.emailId)) {
        throw new Error('Invalid email format');
    }
    if(!validator.isStrongPassword(data.password))
        throw new Error('Password is not strong enough');

}

export const adminvalidate = (data: any) => {
    const mandatoryFields = ['name', 'emailId', 'password', 'role'];
    const isAllowed = mandatoryFields.every((k) => Object.keys(data).includes(k));
    const isRoleValid = data.role === 'admin' || data.role === 'user';
    if(!isRoleValid){
        throw new Error("Invalid Role");
    }
    if(!isAllowed) {
        throw new Error('Missing mandatory fields');
    }
    if(!validator.isLength(data.name, {min: 3, max: 20})) {
        throw new Error('Name must be between 3 and 20 characters');
    }
    if(!validator.isEmail(data.emailId)) {
        throw new Error('Invalid email format');
    }
    if(!validator.isStrongPassword(data.password))
        throw new Error('Password is not strong enough');

}