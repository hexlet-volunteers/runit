import { z } from 'zod/v4';
export declare const sectionSchema: z.ZodObject<{
    id: z.ZodNumber;
    title: z.ZodString;
    description: z.ZodString;
    content: z.ZodString;
    componentType: z.ZodString;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
}, z.core.$strip>;
export declare const createSectionSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    content: z.ZodString;
    componentType: z.ZodString;
}, z.core.$strip>;
export declare const updateSectionSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    componentType: z.ZodOptional<z.ZodString>;
    id: z.ZodNumber;
}, z.core.$strip>;
export type ValidSection = z.infer<typeof sectionSchema>;
export type CreateSectiontInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
export declare function getHomePageData(): Promise<ValidSection[]>;
export declare function getSectionById(id: number): Promise<ValidSection | undefined>;
export declare function createSection(input: CreateSectiontInput): Promise<ValidSection>;
export declare function updateSection(input: UpdateSectionInput): Promise<ValidSection>;
