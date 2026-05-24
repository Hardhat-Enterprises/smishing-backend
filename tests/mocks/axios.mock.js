import { jest } from "@jest/globals";

export const mockPost = jest.fn();

export function setupAxiosMock() {
    jest.unstable_mockModule("axios", () => ({
        default: {
            post: mockPost,
        },
    }));
}
