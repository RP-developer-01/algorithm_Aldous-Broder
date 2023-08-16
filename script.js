// Получение элемента canvas и его 2D-контекста
const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");

const StartButton = document.getElementById("Start");
const StopButton = document.getElementById("Stop");
const ResumeButton = document.getElementById("Resume");
const RestartButton = document.getElementById("Restart");

let isGenerating = false;
let savedTractorsState = [];
let savedMatrixState = [];


// Константы, определяющие свойства лабиринта
const CELL_SIZE = 10;           // Размер ячейки в пикселях
const PADDING = 5;              // Отступы от краев холста
const WALL_COLOR = 'black';     // Цвет стен лабиринта 
const FREE_COLOR = 'white';     // Цвет свободных проходов лабиринта 
const BACKGROUND = 'grey';      // Цвет фона холста 
const TRACTOR_COLOR = 'red';    // Цвет трактора

// Флаг, указывающий, нужно ли отображать анимацию процесса генерации лабиринта
const WITH_ANIMATION = true;

// Количество тракторов, используемых для генерации лабиринта
const TRACTOR_NUMBER = 5;

// Задержка анимации между шагами (в миллисекундах)
const DELAY_TIMEOUT = 0;

// Количество столбцов и строк в матрице лабиринта
let COLUMNS = 31;
let ROWS = 31;

// Создание матрицы, заполненной ложными значениями, представляющими стены в лабиринте
let matrix = createMatrix(COLUMNS, ROWS);

// Инициализация начальной точки в матрице лабиринта как 'true'
matrix[0][0] = true;

// Инициализация массива для хранения позиций тракторов в лабиринте
const tractors = [];
for (let i = 0; i < TRACTOR_NUMBER; i++) {
    tractors.push({
        x: 0,
        y: 0,
    });
}

// Запускает процесс генерации лабиринта
StartButton.addEventListener("click", function () {
    canvas.style.display = "block";
    isGenerating = true;
    StartButton.style.display = "none";
    StopButton.style.display = "block";
    RestartButton.style.display = "none"; // Скрыть кнопку "Сгенерировать заново"
    main();
});

// Остановка процесс генерации лабиринта
StopButton.addEventListener("click", function () {
    isGenerating = false;
    savedTractorsState = tractors.map(tractor => ({ ...tractor }));
    savedMatrixState = matrix.map(row => [...row]);
    StopButton.style.display = "none";
    ResumeButton.style.display = "block";
});

// Возобновить процесс генерации лабиринта
ResumeButton.addEventListener("click", function () {
    isGenerating = true;
    savedTractorsState.forEach((tractor, index) => {
        tractors[index] = { ...tractor };
    });


    for (let y = 0; y < COLUMNS; y++) {
        for (let x = 0; x < ROWS; x++) {
            matrix[y][x] = savedMatrixState[y][x];
        }
    }

    ResumeButton.style.display = "none";
    RestartButton.style.display = "none";
    StopButton.style.display = "block";
    main();
});


// Начать процесс генерации лабиринта сначала
RestartButton.addEventListener("click", function () {
    isGenerating = true;
    StartButton.style.display = "none";
    StopButton.style.display = "block";
    RestartButton.style.display = "none";
    ResumeButton.style.display = "none";


    // Сброс состояния матрицы и позиций тракторов
    resetMaze();
    main();
});

// Главный цикл для процесса генерации лабиринта
async function main() {

    // Продолжаем цикл до тех пор, пока не будет сгенерирован лабиринт
    while (isGenerating && !isValidMaze()) {
        // Перемещаем каждый трактор случайным образом в лабиринте
        for (const tractor of tractors) {
            moveTractor(tractor);
        }

        // Рисуем лабиринт и тракторы в процессе генерации (с возможной анимацией)
        if (WITH_ANIMATION) {
            drawMaze();

            for (const tractor of tractors) {
                drawTractor(tractor);
            }

            await delay(DELAY_TIMEOUT);
        }
    }

    // Рисуем окончательный лабиринт, когда он сгенерирован
    drawMaze();

    // Генерация лабиринта завершена, показываем кнопку "Сгенерировать заново" и скриваем кнопку "Стоп"
    RestartButton.style.display = "block";
    StopButton.style.display = "none";

}

// Функция задержки с использованием промисов для приостановки анимации
function delay(timeout) {
    return new Promise(resolve => setTimeout(resolve, timeout));
}

// Функция для создания пустой матрицы с заданным количеством столбцов и строк
function createMatrix(columns, rows) {
    const matrix = [];
    for (let y = 0; y < rows; y++) {
        const row = [];
        for (let x = 0; x < columns; x++) {
            row.push(false);
        }
        matrix.push(row);
    }
    return matrix;
}

// Функция для отрисовки лабиринта на холсте
function drawMaze() {
    canvas.width = PADDING * 2 + COLUMNS * CELL_SIZE;
    canvas.height = PADDING * 2 + ROWS * CELL_SIZE;

    context.beginPath();
    context.rect(0, 0, canvas.width, canvas.height);
    context.fillStyle = BACKGROUND;
    context.fill();

    for (let y = 0; y < COLUMNS; y++) {
        for (let x = 0; x < ROWS; x++) {
            const color = matrix[y][x] ? FREE_COLOR : WALL_COLOR;

            context.beginPath();
            context.rect(
                PADDING + x * CELL_SIZE,
                PADDING + y * CELL_SIZE,
                CELL_SIZE,
                CELL_SIZE
            );
            context.fillStyle = color;
            context.fill();
        }
    }
}

// Функция для отрисовки трактора на его текущей позиции
function drawTractor(tractor) {
    context.beginPath();
    context.rect(
        PADDING + tractor.x * CELL_SIZE,
        PADDING + tractor.y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
    );
    context.fillStyle = TRACTOR_COLOR;
    context.fill();
}

// Функция для перемещения трактора случайным образом в лабиринте
function moveTractor(tractor) {
    const directions = [];

    if (tractor.x > 0) {
        directions.push([-2, 0]);
    }
    if (tractor.x < COLUMNS - 1) {
        directions.push([2, 0]);
    }
    if (tractor.y > 0) {
        directions.push([0, -2]);
    }
    if (tractor.y < ROWS - 1) {
        directions.push([0, 2]);
    }

    const [dx, dy] = getRandomItem(directions);

    // Перемещаем трактор, обновляя его позицию в матрице лабиринта
    tractor.x += dx;
    tractor.y += dy;

    // Помечаем посещенные позиции как 'true' в матрице лабиринта
    if (!matrix[tractor.y][tractor.x]) {
        matrix[tractor.y][tractor.x] = true;
        matrix[tractor.y - dy / 2][tractor.x - dx / 2] = true;
    }
}

// Функция для получения случайного элемента из массива
function getRandomItem(array) {
    const index = Math.floor(Math.random() * array.length);
    return array[index];
}

// Функция для проверки, является ли лабиринт полностью сгенерированным (каждая вторая ячейка помечена как посещенная)
function isValidMaze() {
    for (let y = 0; y < COLUMNS; y += 2) {
        for (let x = 0; x < ROWS; x += 2) {
            if (!matrix[y][x]) {
                return false;
            }
        }
    }

    return true;
}

// Функция для сброса состояния матрици
function resetMaze() {
    matrix = createMatrix(COLUMNS, ROWS);

    for (const tractor of tractors) {
        tractor.x = 0;
        tractor.y = 0;
    }

    matrix[0][0] = true;

    savedTractorsState = [];
    savedMatrixState = [];
}

const gridSizeSelect = document.getElementById("gridSize");

gridSizeSelect.addEventListener("change", function () {
    const selectedSize = parseInt(gridSizeSelect.value);

    COLUMNS = selectedSize;
    ROWS = selectedSize;


    resetMaze();
    main();

    StartButton.style.display = "block";
    StopButton.style.display = "none";
    RestartButton.style.display = "none";
    ResumeButton.style.display = "none";
});
