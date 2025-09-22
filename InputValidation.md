## Input Validation

We use Zod to check request data **before** it hits our controllers. If the data is bad, we stop the request and return a HTTP 422. If it is good, we pass it to the controller.

### How it Works

- You write a schema that describes the request body.
- The `validate(schema)` middleware runs first on a route.
- On failure: we send HTTP 422 with along with the errors.
- On success: you get a validated `req.body` in your controller.

---

### Validate function

The `src\utils\validation\auth.validation.js` file holds the schema and the validate function, currently this file only validates auth routes. The validate function takes a schema as a parameter and uses the schema to allow the data through if it passes the checks, or throw an error if a rule is broken.
Probably don't edit the validate function unless you have a reason to. The schema is below this.

---

### Writing a Schema

A field schema is set up like this:

```JavaScript
const emailSchema = z
    .string({ required_error: "Email is required." })
    .trim()
    .toLowerCase()
    .refine((e) => /^[^@]+@[^@]+\.[A-Za-z]{2,6}$/.test(e), "Invalid email format.");
```

<br></br>
An actual endpoint schema is setup like this (these can use the field schemas)

```JavaScript
export const signupSchema = z
    .object({
        fullName: z // fullName isnt reused anywhere so we just create the field inside the endpoint schema
            .string({ required_error: "fullName is required." })
            .trim()
            .min(1, "fullName is required.")
            .max(100, "fullName too long."),
        phoneNumber: phoneSchema,
        email: emailSchema, // the field schema setup above
        password: passwordSchema,
    })
    .strict();
```

Notice how the email schema is used _within_ the signup schema, the schemas are reusable.
<br></br>

Now in the routes file you need to pass it through the appropriate validator first.

```JavaScript
// POST /signup
router.post("/signup", validate(signupSchema), signup);
```

Its important to remove any inline validation in controllers. Controllers should assume the input is already valid.

---

You also need to take into consideration what validation is going on at the front end. The backend should be at most equally as permissive as the frontend.
