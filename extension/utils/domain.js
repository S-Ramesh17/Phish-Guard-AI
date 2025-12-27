// Mock Domain Utils
// Used by importing or copy-pasting into logic where modules aren't available
const DomainUtils = {
    getDomain: (url) => {
        try {
            return new URL(url).hostname;
        } catch (e) {
            return null;
        }
    }
};
