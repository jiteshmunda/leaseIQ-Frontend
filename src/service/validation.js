export const isStrongPassword = (value) => {
    const password = value ?? "";
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    return hasLetter && hasNumber && hasSymbol;
};

export const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Min 8 characters required";
    if (!isStrongPassword(password)) {
        return "Password must include a letter, a number, and a symbol";
    }
    return null;
};
