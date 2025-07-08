// examples/mutation-tracking-example.tsx
import React, { useState } from 'react'
import { QueryClient, QueryClientProvider, useQuery, useMutation, useIsMutating } from 'light-query'

const queryClient = new QueryClient()

// Mock API functions
const fetchTodos = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  return [
    { id: 1, title: 'Learn React', completed: false },
    { id: 2, title: 'Build an app', completed: true }
  ]
}

const addTodo = async (title: string) => {
  await new Promise(resolve => setTimeout(resolve, 2000))
  return { id: Date.now(), title, completed: false }
}

const TodoList: React.FC = () => {
  const [newTodo, setNewTodo] = useState('')
  
  const { data: todos, isLoading, error } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    staleTime: 5000
  })
  
  const addTodoMutation = useMutation({
    mutationFn: addTodo,
    onSuccess: (newTodo) => {
      console.log('Todo added:', newTodo)
      // In a real app, you'd invalidate or update the cache here
    }
  })
  
  const mutatingCount = useIsMutating()
  
  const handleAddTodo = () => {
    if (newTodo.trim()) {
      addTodoMutation.mutate(newTodo.trim())
      setNewTodo('')
    }
  }
  
  if (isLoading) return <div>Loading todos...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div>
      <h2>Todo List</h2>
      
      <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f0f0f0' }}>
        <strong>Active Mutations: {mutatingCount}</strong>
        {mutatingCount > 0 && <span> (Processing...)</span>}
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new todo..."
          style={{ marginRight: '0.5rem', padding: '0.5rem' }}
        />
        <button 
          onClick={handleAddTodo}
          disabled={addTodoMutation.status === 'loading'}
          style={{ padding: '0.5rem 1rem' }}
        >
          {addTodoMutation.status === 'loading' ? 'Adding...' : 'Add Todo'}
        </button>
      </div>
      
      <ul>
        {todos?.map(todo => (
          <li key={todo.id}>
            <input 
              type="checkbox" 
              checked={todo.completed}
              readOnly
              style={{ marginRight: '0.5rem' }}
            />
            {todo.title}
          </li>
        ))}
      </ul>
      
      {addTodoMutation.status === 'error' && (
        <div style={{ color: 'red', marginTop: '1rem' }}>
          Error adding todo: {addTodoMutation.error?.message}
        </div>
      )}
    </div>
  )
}

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ padding: '2rem' }}>
        <h1>Light Query - Mutation Tracking Example</h1>
        <TodoList />
      </div>
    </QueryClientProvider>
  )
}

export default App
