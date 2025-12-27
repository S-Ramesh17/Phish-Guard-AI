// Mock PhishTank Utils
const PhishTankUtils = {
    checkUrl: (url) => {
        // Simple mock detection
        return url.includes('phish');
    }
};
