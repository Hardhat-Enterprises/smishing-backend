import * as z from "zod";

export const validate = (schema) => (req, res, next) => {
    try {
        const parsed = schema.parse(req.body);
        req.body = parsed;
        next();
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(422).json({
                success: false,
                message: "Invalid request.",
                errors: err.issues.map((e) => ({
                    path: e.path.join("."),
                    message: e.message,
                })),
            });
        }
        next(err);
    }
};

// Sets up validation rules for each input
const emailSchema = z
    .string({ required_error: "Email is required." })
    .trim()
    .toLowerCase()
    .refine((e) => /^[^@]+@[^@]+\.[A-Za-z]{2,6}$/.test(e), "Invalid email format."); //matches regex from frontend.

// List of commonly used weak passwords to block
const COMMON_PASSWORDS = [
    "Password1!",
    "Password123!",
    "Admin@123",
    "Welcome@1",
    "Qwerty@123",
    "P@ssword1",
    "P@ssw0rd",
    "Hello@123",
    "Abc@1234",
    "Iloveyou@1",
    "Summer@1",
    "Winter@1",
    "Spring@1",
    "Autumn@1",
    "Monday@1",
    "January@1",
    "Dragon@1",
    "Master@1",
    "Superman@1",
    "Batman@1",
];

// Entropy scoring function — measures true password randomness
function calculateEntropy(password) {
    const charsets = [/[a-z]/, /[A-Z]/, /[0-9]/, /[!@#$%^&*+=?-]/];
    const poolSize = charsets.reduce((sum, re) => sum + (re.test(password) ? 26 : 0), 0);
    return password.length * Math.log2(poolSize || 1);
}

const passwordSchema = z
    .string({ required_error: "Password is required." })
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password is too long.")
    .refine((v) => /[0-9]/.test(v), "Password must include a number.")
    .refine((v) => /[A-Z]/.test(v), "Password must include an uppercase letter.")
    .refine((v) => /[a-z]/.test(v), "Password must include a lowercase letter.")
    .refine((v) => /[!@#$%^&*+=?-]/.test(v), "Password must include a special character.")
    .refine((v) => !COMMON_PASSWORDS.includes(v), "Password is too common. Please choose a stronger password.")
    .refine((v) => calculateEntropy(v) >= 50, "Password is not strong enough. Try a longer or more varied password.");

const phoneSchema = z
    .string({ required_error: "phoneNumber is required." })
    .trim()
    .regex(/^[+0-9()\-\s]{3,25}$/, "Invalid phone number.");

export const signupSchema = z
    .object({
        fullName: z
            .string({ required_error: "fullName is required." })
            .trim()
            .min(1, "fullName is required.")
            .max(100, "fullName too long."),
        phoneNumber: phoneSchema,
        email: emailSchema,
        password: passwordSchema,
    })
    .strict();

export const loginSchema = z
    .object({
        email: emailSchema,
        password: z.string({ required_error: "Password is required." }).min(1),
    })
    .strict();

export const verifyEmailSchema = z
    .object({
        email: emailSchema,
        otp: z
            .string({ required_error: "OTP is required." })
            .trim()
            .regex(/^\d{6}$/, `OTP must be 6 digits.`),
    })
    .strict();

export const forgotPasswordSchema = z
    .object({
        email: emailSchema,
    })
    .strict();

export const resetPasswordSchema = z
    .object({
        email: emailSchema,
        newPassword: passwordSchema,
        otp: z
            .string({ required_error: "OTP is required." })
            .trim()
            .regex(/^\d{6}$/, `OTP must be 6 digits.`),
    })
    .strict();
