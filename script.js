let currentTaskType = "todo";
let currentTaskId = null;
let editingTask = false;
let checkBoxSelection = {
    todo: false,
    analysis: false,
    started: false,
    completed: false
};
let isSelectionOn = false;

let allTasksCache = {
    todo: {},
    analysis: {},
    started: {},
    completed: {},
};

let selectedTasks = {
    todo: {},
    analysis: {},
    started: {},
    completed: {},
};

// all button elements.
const addBtn = document.querySelector(".add-btn");
const removeBtn = document.querySelector(".remove-btn");
const saveBtn = document.querySelector(".save-btn");
const closeBtn = document.querySelector(".close-btn");

const textAreaEle = document.querySelector(".task-detail");
const storyPointEle = document.querySelector(".story-points");

// modal element
const modal = document.querySelector(".modal-container");
const modalHeader = document.querySelector(".modal-header");

//action color container element
const actionColorContainerPalletes = document.querySelectorAll(".action-color-container > .colors-pallate");

// Modal open and close logic.
addBtn.addEventListener("click", () => {
    editingTask = false;
    currentTaskId = null;
    modal.style.display = "flex";
    modalHeader.innerText = "Create Task";
    textAreaEle.value = "";
    storyPointEle.value = 0;
});
closeBtn.addEventListener("click", () => modal.style.display = "none");
saveBtn.addEventListener("click", saveTask);
removeBtn.addEventListener("click", removeSelectedTasks);

//all task color palletes elements inside modal
const taskColorPalletes = document.querySelectorAll(".task-color-pallete-container > .colors-pallate");

textAreaEle.addEventListener("keydown", function(event) {
    if(event.key == "Tab") {
        event.preventDefault();
        textAreaEle.value = textAreaEle.value + "    ";
    }
});

// changing active pallete on click of pallete and to change style adding 
// and removing active class from elements.
taskColorPalletes.forEach(pallete => {
    pallete.addEventListener("click", (event) => {
        if(editingTask) {
            return;
        }
        taskColorPalletes.forEach(pallete => pallete.classList.remove("active"));
        event.target.classList.add("active");
        currentTaskType = event.target.classList[1];
    })
});

actionColorContainerPalletes.forEach(pallete => {
    pallete.addEventListener("click", (event) => {
        let taskType = event.target.classList[1];
        checkBoxSelection[taskType] = !checkBoxSelection[taskType];
        if(checkBoxSelection[taskType]) {
            event.target.classList.add("active");
        } else {
            event.target.classList.remove("active");
            selectedTasks[taskType] = {};
        }
        clearTasksForType(taskType);
        reloadTasksForType(taskType);
        isSelectionOn = Object.keys(checkBoxSelection).reduce((acc, key) => acc || checkBoxSelection[key], false);
    })
});

readFromCacheAndLoadTasks();


function saveTask() {
    const task = {
        label: textAreaEle.value,
        points: storyPointEle.value
    }; 
    if(!task.label || task.label == "") {
        alert("Please Enter the task detail first");
        return;
    }

    // adding task on dom
    let taskId = currentTaskId ? currentTaskId : uniqueId(6);
    if(currentTaskId) {
        updateTaskInDom(currentTaskId, task);
    } else {
        addNewTaskToDom(currentTaskType, task, taskId);
    }

    //update the cache and localstorage
    updateCache(currentTaskType, taskId, task);

    ///count updation on dom
    updateCountOfTasks(currentTaskType);

    //clear text area and close modal
    textAreaEle.value = "";
    storyPointEle.value = 0;
    modal.style.display = "none";
}

function updateTaskInDom(currentTaskId, task) {
    const taskEle = document.querySelector(`[data-task-id="${currentTaskId}"]`);
    const spanEle = taskEle.querySelector(".header-label");
    const label = task.label + " (" + (task.points || 0)  + ")";
    spanEle.innerText = label;
}

function addNewTaskToDom(taskType, task, taskId) {
    let elementClassName = "." + taskType + "-tasks";
    const taskSectionEle = document.querySelector(elementClassName);
    const taskEle = document.createElement('div');
    taskEle.setAttribute("data-task-id", taskId);
    taskEle.setAttribute("data-task-type", taskType);
    taskEle.setAttribute("draggable", true);
    taskEle.addEventListener("dblclick", editThisTask);
    taskEle.addEventListener("dragstart", dragThisTask);
    //task.style.display = "flex";
    const label = task.label + " (" + (task.points || 0)  + ")";
    const span = ` 
        <i class="fa-solid fa-clipboard-check"></i> 
        <span class="header-label" data-task-id=${taskId} data-task-type=${taskType}> 
            ${label} 
        </span> 
    `;
    const checkbox =`
        <input id="${taskId}" class="input-checkbox-task" data-task-id=${taskId} data-task-type=${taskType} 
            type="checkbox" aria-hidden="true" onchange="taskSelected(event)" />
        <label for="${taskId}" >${label}</label>
    `;

    if(checkBoxSelection[taskType]) {
        taskEle.setAttribute("class", "checkbox-wrapper-task");
    }
    taskEle.innerHTML = checkBoxSelection[taskType] ? checkbox : span;
    taskSectionEle.appendChild(taskEle);
}

function updateCache(taskType, taskId, task) {
    allTasksCache[taskType][taskId] = { ...task, value: taskId};
    localStorage.allTasksCache = JSON.stringify(allTasksCache);
}

function updateCountOfTasks(taskType) {
    let elementClassName = "." + taskType + "-count";
    const countElement = document.querySelector(elementClassName);
    countElement.innerHTML = "(" + Object.keys(allTasksCache[taskType]).length + ")";
}

function readFromCacheAndLoadTasks() {
    let tasksFromStorage = localStorage.getItem("allTasksCache");
    if(tasksFromStorage && tasksFromStorage != "") {
        allTasksCache = JSON.parse(tasksFromStorage);
        Object.keys(allTasksCache).forEach(key => {
            let typeTasks = allTasksCache[key];
            const allTaskIds = Object.keys(typeTasks);
            allTaskIds.forEach(taskId => {
                let task = typeTasks[taskId];
                addNewTaskToDom(key, task, taskId);
            });
            updateCountOfTasks(key);
        });
    }
}

function reloadTasksForType(taskType) {
    const allTaskIds = Object.keys(allTasksCache[taskType]);
    allTaskIds.forEach( taskId => {
        const task = allTasksCache[taskType][taskId];
        addNewTaskToDom(taskType, task, taskId);
    });
}

function clearTasksForType(taskType) {
    let elementClassName = "." + taskType + "-tasks";
    const taskSectionEle = document.querySelector(elementClassName);
    taskSectionEle.innerHTML = "";
}

function editThisTask(event) {
    event.preventDefault();
    event.stopPropagation();
    editingTask = true;
    currentTaskId = event.target.dataset.taskId;
    currentTaskType = event.target.dataset.taskType;
    let {label, points} = allTasksCache[currentTaskType][currentTaskId];
    textAreaEle.value = label;
    storyPointEle.value = points || 0;
    modalHeader.innerText = "Edit Task - (" + currentTaskId + ")";
    taskColorPalletes.forEach(pallete => pallete.classList.remove("active"));
    const collorPallateEleClass = ".task-color-pallete-container > ."  + currentTaskType;
    const currentTaskPallete = document.querySelector(collorPallateEleClass);
    currentTaskPallete.classList.add("active");
    modal.style.display = "flex";
}

function taskSelected(event) {
    const {taskId, taskType} = event.target.dataset;
    if(event.target.checked) {
        selectedTasks[taskType][taskId] = true;
    } else {
        delete selectedTasks[taskType][taskId];
    }
}

function removeSelectedTasks() {
    if(!isSelectionOn)
        return;
    let deleted = false;
    Object.keys(selectedTasks).forEach( type => {
        const selectedTasksIds = Object.keys(selectedTasks[type]);
        if(selectedTasksIds.length > 0) {
            deleted = true;
            selectedTasksIds.forEach(taskId => {
                delete allTasksCache[type][taskId];
            });
            reloadDomForTaskType(type);
        }
    });
    if(deleted) {
        localStorage.allTasksCache = JSON.stringify(allTasksCache);
    }
}

function reloadDomForTaskType(type) {
    clearTasksForType(type);
    reloadTasksForType(type);
}

function dragThisTask(event) {
    let task = { 
        taskId: event.target.dataset.taskId,
        type: event.target.dataset.taskType
    };
    event.dataTransfer.setData("task", JSON.stringify(task));
}

function dropTask(event) {
    const {taskId, type} = JSON.parse(event.dataTransfer.getData("task"));
    const task = allTasksCache[type][taskId];
    const droppingType = event.target.dataset.taskType;
    allTasksCache[droppingType][taskId] = task;
    delete allTasksCache[type][taskId];
    updateCountOfTasks(type);
    updateCountOfTasks(droppingType);
    reloadDomForTaskType(type);
    reloadDomForTaskType(droppingType);
    localStorage.allTasksCache = JSON.stringify(allTasksCache);
}

function allowDropTask(event) {
    event.preventDefault();
}

const uniqueId = (length=16) => {
    return parseInt(Math.ceil(Math.random() * Date.now()).toPrecision(length).toString().replace(".", ""));
}