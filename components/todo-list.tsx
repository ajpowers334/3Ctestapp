"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, Sparkles } from "lucide-react"
import { createTask, updateTaskCompletion, deleteTask, getTasks } from "@/app/actions/tasks"

interface Todo {
  id: string
  text: string
  completed: boolean
  completedAt?: number
}

interface TodoListProps {
  userId: string
}

export function TodoList({ userId }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [inputValue, setInputValue] = useState("")
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch tasks on mount
  useEffect(() => {
    const fetchTasks = async () => {
      const result = await getTasks(userId)
      if (result.success && result.data) {
        setTodos(
          result.data.map((task: any) => ({
            id: task.id,
            text: task.title,
            completed: task.completed,
          }))
        )
      }
      setIsLoading(false)
    }
    fetchTasks()
  }, [userId])

  const addTodo = async () => {
    if (inputValue.trim()) {
      const title = inputValue.trim()
      setInputValue("")
      
      // Optimistically add to UI
      const tempId = `temp-${Date.now()}`
      const optimisticTodo: Todo = {
        id: tempId,
        text: title,
        completed: false,
      }
      setTodos([optimisticTodo, ...todos])

      // Save to database
      const result = await createTask(userId, title)
      
      if (result.success && result.data) {
        // Replace optimistic update with real data
        setTodos((prev) =>
          prev.map((todo) =>
            todo.id === tempId
              ? {
                  id: result.data.id,
                  text: result.data.title,
                  completed: result.data.completed,
                }
              : todo
          )
        )
      } else {
        // Remove optimistic update on error
        setTodos((prev) => prev.filter((todo) => todo.id !== tempId))
        alert("Error creating task. Please try again.")
        setInputValue(title) // Restore input value
      }
    }
  }

  const toggleTodo = async (id: string) => {
    const todo = todos.find((t) => t.id === id)
    if (!todo || todo.completed) return

    // Trigger completion animation
    setCompletingId(id)

    // Optimistically update UI
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: true,
              completedAt: Date.now(),
            }
          : t
      )
    )

    // Wait for animation, then update database
    setTimeout(async () => {
      const result = await updateTaskCompletion(id, true)
      
      if (!result.success) {
        // Revert on error
        setTodos((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, completed: false } : t
          )
        )
        alert("Error updating task. Please try again.")
      }
      
      setCompletingId(null)
    }, 600)
  }

  const deleteTodo = async (id: string) => {
    // Optimistically remove from UI
    const todoToDelete = todos.find((t) => t.id === id)
    setTodos(todos.filter((todo) => todo.id !== id))

    // Delete from database
    const result = await deleteTask(id)
    
    if (!result.success) {
      // Restore on error
      if (todoToDelete) {
        setTodos((prev) => [...prev, todoToDelete])
      }
      alert("Error deleting task. Please try again.")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTodo()
    }
  }

  const completedCount = todos.filter((t) => t.completed).length
  const totalCount = todos.length

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Sparkles className="size-6 text-[#185859]" />
          My Tasks
        </CardTitle>
        <CardDescription>
          {totalCount === 0 ? "Add your first task to get started" : `${completedCount} of ${totalCount} completed`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Section */}
        <div className="flex gap-2">
          <Input
            placeholder="Add a new task..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={addTodo} size="icon" className="bg-[#185859] hover:bg-[#185859]/90">
            <Plus className="size-5" />
          </Button>
        </div>

        {/* Todo List */}
        <div className="space-y-2">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className={`group flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${
                completingId === todo.id
                  ? "scale-105 bg-[#185859]/10 border-[#185859]/30"
                  : todo.completed
                    ? "bg-secondary/50 border-border/50"
                    : "bg-card hover:bg-accent/50 border-border"
              } ${todo.completed ? "animate-completion" : "animate-fade-in"}`}
            >
              {/* Checkbox */}
              <div className="relative">
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={() => toggleTodo(todo.id)}
                  disabled={todo.completed}
                  className="data-[state=checked]:bg-[#185859] data-[state=checked]:border-[#185859]"
                />
                {completingId === todo.id && (
                  <div className="absolute inset-0 rounded-full bg-[#185859]/20 animate-ping" />
                )}
              </div>

              {/* Todo Text */}
              <div className="flex-1 min-w-0">
                <p
                  className={`transition-all duration-300 ${
                    todo.completed ? "line-through text-muted-foreground opacity-60" : "text-foreground"
                  }`}
                >
                  {todo.text}
                </p>
              </div>

              {/* Completion Badge */}
              {todo.completed && (
                <div className="text-xs font-medium text-[#185859] bg-[#185859]/10 px-2 py-1 rounded animate-fade-in">
                  Done!
                </div>
              )}

              {/* Delete Button */}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => deleteTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12 text-muted-foreground animate-fade-in">
            <div className="mb-2 text-4xl">⏳</div>
            <p className="text-sm">Loading tasks...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && todos.length === 0 && (
          <div className="text-center py-12 text-muted-foreground animate-fade-in">
            <div className="mb-2 text-4xl">📝</div>
            <p className="text-sm">No tasks yet. Add one above to get started!</p>
          </div>
        )}

        {/* Celebration for all completed */}
        {todos.length > 0 && completedCount === totalCount && (
          <div className="text-center py-6 space-y-2 animate-fade-in bg-[#185859]/5 rounded-lg border border-[#185859]/20">
            <div className="text-3xl">🎉</div>
            <p className="text-sm font-medium text-[#185859]">All tasks completed! Great work!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
