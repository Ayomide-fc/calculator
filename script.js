/* ========================================
   DOM ELEMENTS
======================================== */

const currentDisplay = document.getElementById("result");
const expressionDisplay = document.getElementById("expression");

const historyBtn = document.getElementById("historyBtn");
const historyPanel = document.getElementById("historyPanel");
const closeHistory = document.getElementById("closeHistory");

const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");

const themeBtn = document.getElementById("themeBtn");
const copyBtn = document.getElementById("copyBtn");

const basicModeBtn = document.getElementById("basicModeBtn");
const scientificModeBtn =
    document.getElementById("scientificModeBtn");

const scientificButtons =
    document.getElementById("scientificButtons");

const toast = document.getElementById("toast");


/* ========================================
   CALCULATOR STATE
======================================== */

let currentValue = "0";
let previousValue = null;
let operator = null;

let waitingForOperand = false;

let currentExpression = "";


/* ========================================
   AUDIO
======================================== */

let audioContext = null;

function playSound(frequency = 500, duration = 0.035) {

    try {

        if (!audioContext) {
            audioContext =
                new (window.AudioContext ||
                    window.webkitAudioContext)();
        }

        const oscillator =
            audioContext.createOscillator();

        const gain =
            audioContext.createGain();

        oscillator.type = "sine";

        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(
            0.04,
            audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + duration
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start();

        oscillator.stop(
            audioContext.currentTime + duration
        );

    } catch (error) {
        // Audio isn't essential to the calculator.
    }
}


/* ========================================
   DISPLAY
======================================== */

function updateDisplay() {

    currentDisplay.textContent = formatNumber(currentValue);

    if (currentExpression) {
        expressionDisplay.textContent = currentExpression;
    } else if (previousValue !== null && operator) {

        expressionDisplay.textContent =
            `${formatNumber(previousValue)} ${getOperatorSymbol(operator)}`;

    } else {
        expressionDisplay.textContent = "0";
    }

    animateResult();
}


function animateResult() {

    currentDisplay.classList.remove("pop");

    // Force reflow so animation can replay
    void currentDisplay.offsetWidth;

    currentDisplay.classList.add("pop");
}


/* ========================================
   NUMBER FORMATTING
======================================== */

function formatNumber(value) {

    if (value === "Error") {
        return "Error";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "Error";
    }

    if (Math.abs(number) >= 1e12) {
        return number.toExponential(6);
    }

    if (
        Math.abs(number) >= 1 &&
        value.includes(".")
    ) {
        return value;
    }

    return value;
}


/* ========================================
   OPERATOR SYMBOL
======================================== */

function getOperatorSymbol(op) {

    const symbols = {
        "+": "+",
        "-": "−",
        "*": "×",
        "/": "÷"
    };

    return symbols[op] || op;
}


/* ========================================
   INPUT NUMBER
======================================== */

function inputNumber(number) {

    playSound(520);

    if (
        currentValue === "Error" ||
        waitingForOperand
    ) {

        currentValue = number;

        waitingForOperand = false;

    } else if (currentValue === "0") {

        currentValue = number;

    } else {

        currentValue += number;
    }

    currentExpression = "";

    updateDisplay();
}


/* ========================================
   DECIMAL
======================================== */

function inputDecimal() {

    playSound(600);

    if (
        currentValue === "Error" ||
        waitingForOperand
    ) {

        currentValue = "0.";
        waitingForOperand = false;

    } else if (!currentValue.includes(".")) {

        currentValue += ".";
    }

    currentExpression = "";

    updateDisplay();
}


/* ========================================
   OPERATOR
======================================== */

function chooseOperator(selectedOperator) {

    playSound(700);

    if (currentValue === "Error") {
        clearCalculator();
        return;
    }

    if (
        operator &&
        !waitingForOperand
    ) {
        calculate(false);
    }

    previousValue = parseFloat(currentValue);

    operator = selectedOperator;

    waitingForOperand = true;

    currentExpression =
        `${formatNumber(currentValue)} ${getOperatorSymbol(selectedOperator)}`;

    updateDisplay();
}


/* ========================================
   CALCULATE
======================================== */

function calculate(saveToHistory = true) {

    if (
        operator === null ||
        previousValue === null
    ) {
        return;
    }

    const firstNumber = previousValue;
    const secondNumber = parseFloat(currentValue);

    let result;

    switch (operator) {

        case "+":
            result = firstNumber + secondNumber;
            break;

        case "-":
            result = firstNumber - secondNumber;
            break;

        case "*":
            result = firstNumber * secondNumber;
            break;

        case "/":

            if (secondNumber === 0) {

                currentValue = "Error";

                previousValue = null;
                operator = null;

                waitingForOperand = true;

                currentExpression =
                    "Cannot divide by zero";

                updateDisplay();

                playSound(180, 0.12);

                return;
            }

            result = firstNumber / secondNumber;

            break;

        default:
            return;
    }


    result = cleanNumber(result);

    const expression =
        `${formatNumber(String(firstNumber))} ` +
        `${getOperatorSymbol(operator)} ` +
        `${formatNumber(String(secondNumber))}`;


    currentValue = String(result);

    previousValue = null;
    operator = null;

    waitingForOperand = true;

    currentExpression =
        saveToHistory ? expression : "";


    if (saveToHistory) {

        addHistory(
            expression,
            currentValue
        );
    }

    playSound(850);

    updateDisplay();
}


/* ========================================
   CLEAN NUMBER
======================================== */

function cleanNumber(number) {

    if (!Number.isFinite(number)) {
        return "Error";
    }

    return parseFloat(
        number.toFixed(12)
    );
}


/* ========================================
   CLEAR
======================================== */

function clearCalculator() {

    playSound(250);

    currentValue = "0";
    previousValue = null;
    operator = null;

    waitingForOperand = false;

    currentExpression = "";

    updateDisplay();
}


/* ========================================
   DELETE
======================================== */

function deleteNumber() {

    playSound(350);

    if (
        waitingForOperand ||
        currentValue === "Error"
    ) {
        return;
    }

    if (currentValue.length <= 1) {

        currentValue = "0";

    } else {

        currentValue =
            currentValue.slice(0, -1);
    }

    updateDisplay();
}


/* ========================================
   PERCENTAGE
======================================== */

function percentage() {

    playSound(600);

    if (currentValue === "Error") {
        return;
    }

    const number =
        parseFloat(currentValue);

    currentValue =
        String(cleanNumber(number / 100));

    updateDisplay();
}


/* ========================================
   TOGGLE SIGN
======================================== */

function toggleSign() {

    playSound(400);

    if (
        currentValue === "0" ||
        currentValue === "Error"
    ) {
        return;
    }

    currentValue =
        String(
            parseFloat(currentValue) * -1
        );

    updateDisplay();
}


/* ========================================
   SCIENTIFIC FUNCTIONS
======================================== */

function scientificOperation(operation) {

    if (currentValue === "Error") {
        return;
    }

    const number =
        parseFloat(currentValue);

    let result;

    switch (operation) {

        case "sin":
            result =
                Math.sin(
                    number * Math.PI / 180
                );
            break;

        case "cos":
            result =
                Math.cos(
                    number * Math.PI / 180
                );
            break;

        case "tan":
            result =
                Math.tan(
                    number * Math.PI / 180
                );
            break;

        case "sqrt":

            if (number < 0) {
                showError("Invalid square root");
                return;
            }

            result = Math.sqrt(number);
            break;

        case "log":

            if (number <= 0) {
                showError("Invalid logarithm");
                return;
            }

            result = Math.log10(number);
            break;

        case "ln":

            if (number <= 0) {
                showError("Invalid logarithm");
                return;
            }

            result = Math.log(number);
            break;

        case "square":
            result = number ** 2;
            break;

        case "cube":
            result = number ** 3;
            break;

        case "inverse":

            if (number === 0) {
                showError("Cannot divide by zero");
                return;
            }

            result = 1 / number;
            break;

        case "pi":
            result = Math.PI;
            break;

        case "e":
            result = Math.E;
            break;

        case "factorial":

            if (
                number < 0 ||
                !Number.isInteger(number)
            ) {
                showError(
                    "Factorial needs a positive integer"
                );
                return;
            }

            if (number > 170) {
                showError("Number too large");
                return;
            }

            result = factorial(number);
            break;

        default:
            return;
    }

    result = cleanNumber(result);

    currentExpression =
        `${operation}(${formatNumber(currentValue)})`;

    currentValue = String(result);

    waitingForOperand = true;

    playSound(750);

    updateDisplay();
}


/* ========================================
   FACTORIAL
======================================== */

function factorial(number) {

    if (number === 0 || number === 1) {
        return 1;
    }

    let result = 1;

    for (
        let i = 2;
        i <= number;
        i++
    ) {
        result *= i;
    }

    return result;
}


/* ========================================
   ERROR
======================================== */

function showError(message) {

    currentValue = "Error";

    currentExpression = message;

    waitingForOperand = true;

    playSound(180, 0.12);

    updateDisplay();
}


/* ========================================
   HISTORY
======================================== */

let history =
    JSON.parse(
        localStorage.getItem(
            "calculatorHistory"
        )
    ) || [];


function addHistory(expression, result) {

    history.unshift({
        expression,
        result,
        time: Date.now()
    });

    // Keep only latest 50
    history = history.slice(0, 50);

    saveHistory();

    renderHistory();
}


function saveHistory() {

    localStorage.setItem(
        "calculatorHistory",
        JSON.stringify(history)
    );
}


function renderHistory() {

    historyList.innerHTML = "";

    if (history.length === 0) {

        historyList.innerHTML = `
            <div class="empty-history">
                No calculations yet
            </div>
        `;

        return;
    }


    history.forEach((item, index) => {

        const element =
            document.createElement("div");

        element.className = "history-item";

        element.innerHTML = `
            <div class="history-expression">
                ${escapeHTML(item.expression)}
            </div>

            <div class="history-result">
                = ${escapeHTML(item.result)}
            </div>
        `;


        element.addEventListener(
            "click",
            () => {

                currentValue =
                    String(item.result);

                previousValue = null;
                operator = null;

                waitingForOperand = true;

                currentExpression =
                    item.expression;

                updateDisplay();

                historyPanel.classList.remove(
                    "open"
                );
            }
        );


        historyList.appendChild(element);
    });
}


/* ========================================
   ESCAPE HTML
======================================== */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent = String(value);

    return div.innerHTML;
}


/* ========================================
   HISTORY OPEN / CLOSE
======================================== */

historyBtn.addEventListener(
    "click",
    () => {

        playSound(450);

        historyPanel.classList.add(
            "open"
        );

        renderHistory();
    }
);


closeHistory.addEventListener(
    "click",
    () => {

        playSound(350);

        historyPanel.classList.remove(
            "open"
        );
    }
);


clearHistoryBtn.addEventListener(
    "click",
    () => {

        playSound(250);

        history = [];

        saveHistory();

        renderHistory();
    }
);


/* ========================================
   THEME
======================================== */

const savedTheme =
    localStorage.getItem("calculatorTheme");

if (savedTheme === "light") {
    document.body.classList.add("light");
}


themeBtn.addEventListener(
    "click",
    () => {

        playSound(500);

        document.body.classList.toggle(
            "light"
        );

        const theme =
            document.body.classList.contains("light")
                ? "light"
                : "dark";

        localStorage.setItem(
            "calculatorTheme",
            theme
        );
    }
);


/* ========================================
   COPY RESULT
======================================== */

copyBtn.addEventListener(
    "click",
    async () => {

        if (
            currentValue === "Error"
        ) {
            return;
        }

        try {

            await navigator.clipboard.writeText(
                currentValue
            );

            playSound(650);

            showToast("Copied!");

        } catch (error) {

            showToast(
                "Could not copy"
            );
        }
    }
);


/* ========================================
   TOAST
======================================== */

let toastTimeout;

function showToast(message) {

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout =
        setTimeout(
            () => {
                toast.classList.remove("show");
            },
            1800
        );
}


/* ========================================
   BASIC / SCIENTIFIC MODE
======================================== */

basicModeBtn.addEventListener(
    "click",
    () => {

        playSound(400);

        basicModeBtn.classList.add(
            "active"
        );

        scientificModeBtn.classList.remove(
            "active"
        );

        scientificButtons.classList.add(
            "hidden"
        );
    }
);


scientificModeBtn.addEventListener(
    "click",
    () => {

        playSound(500);

        scientificModeBtn.classList.add(
            "active"
        );

        basicModeBtn.classList.remove(
            "active"
        );

        scientificButtons.classList.remove(
            "hidden"
        );
    }
);


/* ========================================
   SCIENTIFIC BUTTON EVENTS
======================================== */

document
    .querySelectorAll(
        "[data-scientific]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                scientificOperation(
                    button.dataset.scientific
                );
            }
        );
    });


/* ========================================
   BASIC BUTTON EVENTS
======================================== */

document
    .querySelectorAll(
        ".buttons button"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                if (
                    button.dataset.number !==
                    undefined
                ) {

                    inputNumber(
                        button.dataset.number
                    );

                    return;
                }


                if (
                    button.dataset.operator !==
                    undefined
                ) {

                    chooseOperator(
                        button.dataset.operator
                    );

                    return;
                }


                const action =
                    button.dataset.action;


                switch (action) {

                    case "clear":
                        clearCalculator();
                        break;

                    case "delete":
                        deleteNumber();
                        break;

                    case "decimal":
                        inputDecimal();
                        break;

                    case "percent":
                        percentage();
                        break;

                    case "sign":
                        toggleSign();
                        break;

                    case "equals":
                        calculate(true);
                        break;
                }
            }
        );
    });


/* ========================================
   KEYBOARD SUPPORT
======================================== */

document.addEventListener(
    "keydown",
    event => {

        const key = event.key;


        if (
            key >= "0" &&
            key <= "9"
        ) {

            inputNumber(key);

            return;
        }


        if (key === ".") {

            inputDecimal();

            return;
        }


        if (
            ["+", "-", "*", "/"]
                .includes(key)
        ) {

            chooseOperator(key);

            return;
        }


        if (
            key === "Enter" ||
            key === "="
        ) {

            calculate(true);

            return;
        }


        if (key === "Backspace") {

            deleteNumber();

            return;
        }


        if (key === "Escape") {

            clearCalculator();

            return;
        }


        if (key === "%") {

            percentage();

            return;
        }
    }
);


/* ========================================
   INITIALIZE
======================================== */

renderHistory();
updateDisplay();