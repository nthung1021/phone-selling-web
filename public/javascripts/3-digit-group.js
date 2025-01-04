// Utility function to format numbers with 3-digit regex
const formatNumber = (number) => {
    return number.toLocaleString("en-US");
};

// Function to format all numbers with the "three-digit" class
const applyThreeDigitFormat = () => {
    document.querySelectorAll(".three-digit").forEach((element) => {
        const rawValue = parseFloat(element.textContent.replace(/[^0-9.-]+/g, ""));
        if (!isNaN(rawValue)) {
            element.textContent = formatNumber(rawValue);
        }
    });
};

// Expose utility functions globally
window.applyThreeDigitFormat = applyThreeDigitFormat;
