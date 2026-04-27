import { jest } from "@jest/globals";

export function setupEmailMock() {
    jest.unstable_mockModule("../../src/services/email.service.js", () => ({
        sendEmail: jest.fn(),
    }));
}
