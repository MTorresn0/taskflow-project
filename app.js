// Estado inicial
let tasks = [];
let currentFilter = 'all';
let searchQuery = '';
let draggedTaskId = null; // Variable para Drag & Drop

// Referencias al DOM
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskPriority = document.getElementById('taskPriority');
const taskList = document.getElementById('taskList');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const themeToggle = document.getElementById('themeToggle');

function init() {
  loadTasks();
  loadTheme();
  renderTasks();
  updateStats();
}

function loadTasks() {
  const savedTasks = localStorage.getItem('taskflow_tasks');
  if (savedTasks) tasks = JSON.parse(savedTasks);
}

function saveTasks() {
  localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
  updateStats();
}

// Añadir tarea con prioridad
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = taskInput.value.trim();
  if (!title) return;

  const newTask = {
    id: Date.now().toString(),
    title: title,
    completed: false,
    priority: taskPriority.value, // Guardamos la prioridad
    createdAt: new Date().toLocaleDateString()
  };

  tasks.push(newTask);
  saveTasks();
  renderTasks();
  taskInput.value = '';
});

// Renderizar tareas con Drag & Drop y Animaciones
function renderTasks() {
  taskList.innerHTML = '';

  let filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      currentFilter === 'all' ? true :
      currentFilter === 'completed' ? task.completed :
      !task.completed;
    return matchesSearch && matchesFilter;
  });

  if (filteredTasks.length === 0) {
    taskList.innerHTML = '<li class="text-center text-gray-500 py-4">No hay tareas que mostrar.</li>';
    return;
  }

  // Colores para las etiquetas de prioridad
  const priorityColors = {
    'Baja': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Media': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'Alta': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };

  filteredTasks.forEach(task => {
    const li = document.createElement('li');
    
    // Clases Tailwind: transform y transition para animaciones, cursor-move para arrastrar
    li.className = `transition-all duration-300 ease-in-out transform flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border cursor-move ${task.completed ? 'border-green-200 dark:border-green-900 opacity-60' : 'border-gray-200 dark:border-gray-700'}`;
    
    // Configuración de Drag & Drop
    li.draggable = true;
    
    li.addEventListener('dragstart', () => {
      draggedTaskId = task.id;
      setTimeout(() => li.classList.add('opacity-40', 'scale-95'), 0);
    });
    
    li.addEventListener('dragend', () => {
      li.classList.remove('opacity-40', 'scale-95');
      renderTasks();
    });

    li.addEventListener('dragover', (e) => {
      e.preventDefault();
      li.classList.add('border-blue-500', 'border-2'); // Efecto visual al pasar por encima
    });

    li.addEventListener('dragleave', () => {
      li.classList.remove('border-blue-500', 'border-2');
    });

    li.addEventListener('drop', (e) => {
      e.preventDefault();
      if (draggedTaskId && draggedTaskId !== task.id) {
        reorderTasks(draggedTaskId, task.id);
      }
    });

    li.innerHTML = `
      <div class="flex items-center gap-3 flex-1 overflow-hidden pointer-events-none">
        <input type="checkbox" ${task.completed ? 'checked' : ''} 
          onchange="toggleTask('${task.id}')"
          class="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer pointer-events-auto"
          aria-label="Marcar como completada">
        <div class="flex flex-col flex-1">
          <span class="font-medium truncate ${task.completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}">${task.title}</span>
          <div class="flex gap-2 items-center mt-1">
            <span class="text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}">${task.priority}</span>
            <span class="text-xs text-gray-500">Creada: ${task.createdAt}</span>
          </div>
        </div>
      </div>
      <div class="flex gap-2 ml-4">
        <button onclick="editTask('${task.id}')" class="text-yellow-600 hover:text-yellow-700 bg-yellow-50 dark:bg-gray-700 p-2 rounded transition hover:scale-110" aria-label="Editar tarea">✏️</button>
        <button onclick="deleteTask(event, '${task.id}')" class="text-red-600 hover:text-red-700 bg-red-50 dark:bg-gray-700 p-2 rounded transition hover:scale-110" aria-label="Eliminar tarea">🗑️</button>
      </div>
    `;
    taskList.appendChild(li);
  });
}

// Función para reordenar el array de tareas
function reorderTasks(draggedId, targetId) {
  const draggedIndex = tasks.findIndex(t => t.id === draggedId);
  const targetIndex = tasks.findIndex(t => t.id === targetId);
  
  const [draggedTask] = tasks.splice(draggedIndex, 1);
  tasks.splice(targetIndex, 0, draggedTask);
  
  saveTasks();
  renderTasks();
}

window.toggleTask = (id) => {
  tasks = tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
  saveTasks();
  renderTasks();
};

// Eliminar tarea con animación
window.deleteTask = (event, id) => {
  const li = event.target.closest('li');
  // Animación de salida (deslizar a la derecha y desvanecer)
  li.classList.add('opacity-0', 'translate-x-full'); 
  
  // Esperamos a que termine la animación (300ms) antes de borrarla del array
  setTimeout(() => {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
  }, 300);
};

window.editTask = (id) => {
  const task = tasks.find(t => t.id === id);
  const newTitle = prompt('Edita el título de la tarea:', task.title);
  if (newTitle !== null && newTitle.trim() !== '') {
    tasks = tasks.map(t => t.id === id ? { ...t, title: newTitle.trim() } : t);
    saveTasks();
    renderTasks();
  }
};

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statCompleted').textContent = completed;
  document.getElementById('statPending').textContent = total - completed;
}

searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderTasks();
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => {
      b.classList.remove('bg-blue-100', 'text-blue-700', 'dark:bg-gray-700', 'dark:text-white');
      b.classList.add('bg-white', 'text-gray-600', 'dark:bg-gray-800', 'dark:text-gray-300', 'shadow-sm', 'hover:bg-gray-50');
    });
    btn.classList.remove('bg-white', 'text-gray-600', 'dark:bg-gray-800', 'dark:text-gray-300', 'shadow-sm', 'hover:bg-gray-50');
    btn.classList.add('bg-blue-100', 'text-blue-700', 'dark:bg-gray-700', 'dark:text-white');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

document.getElementById('markAllBtn').addEventListener('click', () => {
  tasks = tasks.map(task => ({ ...task, completed: true }));
  saveTasks();
  renderTasks();
});

document.getElementById('clearCompletedBtn').addEventListener('click', () => {
  tasks = tasks.filter(task => !task.completed);
  saveTasks();
  renderTasks();
});

function loadTheme() {
  const savedTheme = localStorage.getItem('taskflow_theme');
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
}

themeToggle.addEventListener('click', () => {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('taskflow_theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
});

init();