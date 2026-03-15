import { z } from "zod";

const contactSchema = z.object({
    name: z.string().trim().min(2),
    email: z.string().email(),
    text: z.string().trim().min(10).max(100),
    captchaToken: z.string()
});

export default contactSchema;
