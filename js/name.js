
document.addEventListener("DOMContentLoaded", function () {
    const typedText = "Sudam Shrestha";
    const typingSpeed = 200; // Typing speed
    const erasingSpeed = 10; // Erasing speed
    const delayBeforeErasing = 2000; // Delay before starting to erase
    let index = 0;
    let isTyping = true;
    const typedElement = document.getElementById("typed-name");

    function typeAndErase() {
        if (isTyping) {
            if (index < typedText.length) {
                typedElement.innerHTML += typedText.charAt(index);
                index++;
                setTimeout(typeAndErase, typingSpeed);
            } else {
                isTyping = false;
                setTimeout(typeAndErase, delayBeforeErasing);
            }
        } else {
            if (index > 0) {
                typedElement.innerHTML = typedText.substring(0, index - 1);
                index--;
                setTimeout(typeAndErase, erasingSpeed);
            } else {
                isTyping = true;
                setTimeout(typeAndErase, typingSpeed);
            }
        }
    }

    typeAndErase();
});