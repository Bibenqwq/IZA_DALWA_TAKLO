import React, { useState } from 'react';
import { Sparkles, Plus, CheckCheck, Check, Edit3, Trash2 } from 'lucide-react';

const CATEGORY_LABELS = {
  gentle: '♡ gentle',
  creative: '✎ creative',
  daily: '☕ daily',
  urgent: '✧ important',
  heart: '🕯 heart'
};

export default function TodoSection({
  todos,
  onAddTodo,
  onToggleTodo,
  onEditTodo,
  onDeleteTodo,
  onClearCompleted
}) {
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('gentle');
  const [filter, setFilter] = useState('all');

  const totalCount = todos.length;
  const completedCount = todos.filter(t => t.completed).length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredTodos = todos.filter(item => {
    if (filter === 'pending') return !item.completed;
    if (filter === 'completed') return item.completed;
    return true;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTodo(newTitle.trim(), newCategory);
    setNewTitle('');
  };

  return (
    <section className="todo-section" id="todo-section">
      <div className="section-container">
        <div className="todo-card">
          <div className="todo-card__header">
            <div className="todo-card__header-left">
              <span className="annotation-label">daily intentions & tasks ♡</span>
              <h2 className="todo-title">iza's to-do list & quiet goals</h2>
              <p className="todo-subtitle">a gentle checklist for the heart — one little step at a time.</p>
            </div>
            <div className="todo-card__header-right">
              <div className="todo-progress-box">
                <span className="todo-progress-count" id="todo-progress-count">
                  {completedCount} of {totalCount} completed
                </span>
                <div className="todo-progress-bar">
                  <div
                    className="todo-progress-fill"
                    id="todo-progress-fill"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* To-Do Input Bar */}
          <form className="todo-input-bar" onSubmit={handleSubmit}>
            <div className="todo-input-wrapper">
              <Sparkles size={16} className="todo-input-icon" />
              <input
                type="text"
                id="new-todo-title"
                className="todo-input"
                placeholder="write a gentle intention, task, or reminder..."
                maxLength="140"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <select
              id="new-todo-category"
              className="todo-select-tag"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            >
              <option value="gentle">♡ gentle reminder</option>
              <option value="creative">✎ creative / writing</option>
              <option value="daily">☕ daily habit</option>
              <option value="urgent">✧ important</option>
              <option value="heart">🕯 dream / heart</option>
            </select>
            <button type="submit" className="btn btn--primary" id="btn-add-todo">
              <Plus size={16} />
              <span>+ add to list</span>
            </button>
          </form>

          {/* To-Do Filter Toolbar */}
          <div className="todo-filter-toolbar">
            <div className="todo-filter-tabs">
              <button
                type="button"
                className={`todo-filter-tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                all
              </button>
              <button
                type="button"
                className={`todo-filter-tab ${filter === 'pending' ? 'active' : ''}`}
                onClick={() => setFilter('pending')}
              >
                pending
              </button>
              <button
                type="button"
                className={`todo-filter-tab ${filter === 'completed' ? 'active' : ''}`}
                onClick={() => setFilter('completed')}
              >
                completed ♡
              </button>
            </div>
            <button
              type="button"
              className="todo-clear-completed-btn"
              id="btn-clear-completed-todos"
              onClick={onClearCompleted}
            >
              <CheckCheck size={14} />
              <span>clear completed</span>
            </button>
          </div>

          {/* To-Do Items List */}
          <div className="todo-list" id="todo-list">
            {filteredTodos.length === 0 ? (
              <div className="todo-empty-state" style={{ textAlign: 'center', padding: '35px 20px', color: '#9b9285', fontStyle: 'italic' }}>
                {filter === 'completed'
                  ? 'no completed tasks yet — take your quiet time ♡'
                  : 'no tasks or intentions in your list yet — write one above to begin ♡'}
              </div>
            ) : (
              filteredTodos.map(item => (
                <div
                  key={item.id}
                  className={`todo-item ${item.completed ? 'completed' : ''}`}
                >
                  <button
                    className={`todo-checkbox-btn ${item.completed ? 'checked' : ''}`}
                    title={item.completed ? "Mark pending" : "Mark completed"}
                    onClick={() => onToggleTodo(item.id)}
                  >
                    {item.completed ? <Check size={12} /> : null}
                  </button>

                  <div className="todo-item-content">
                    <span className={`todo-tag todo-tag--${item.category || 'gentle'}`}>
                      {CATEGORY_LABELS[item.category] || '♡ gentle'}
                    </span>
                    <span className="todo-item-title">{item.title}</span>
                  </div>

                  <div className="todo-item-actions">
                    <button
                      className="todo-item-action-btn todo-item-action-btn--edit"
                      title="Edit task"
                      onClick={() => onEditTodo(item)}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      className="todo-item-action-btn todo-item-action-btn--delete"
                      title="Delete task"
                      onClick={() => onDeleteTodo(item.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
