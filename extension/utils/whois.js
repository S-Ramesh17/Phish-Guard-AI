// Mock WHOIS Utils
const WhoisUtils = {
    checkAge: (domain) => {
        // Return mock age
        if (domain.includes('new') || domain.includes('test')) return 5;
        return 365;
    }
};
