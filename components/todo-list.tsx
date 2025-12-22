"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, Sparkles } from "lucide-react"

interface Todo {
  id: string
  text: string
  completed: boolean
  completedAt?: number
}

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [inputValue, setInputValue] = useState("")
  const [completingId, setCompletingId] = useState<string | null>(null)

  const addTodo = () => {
    if (inputValue.trim()) {
      const newTodo: Todo = {
        id: Date.now().toString(),
        text: inputValue.trim(),
        completed: false,
      }
      setTodos([newTodo, ...todos])
      setInputValue("")
    }
  }

  const toggleTodo = (id: string) => {
    const todo = todos.find((t) => t.id === id)
    if (!todo || todo.completed) return

    // Trigger completion animation
    setCompletingId(id)

    // Wait for animation, then update state
    setTimeout(() => {
      setTodos(
        todos.map((todo) =>
          todo.id === id
            ? {
                ...todo,
                completed: true,
                completedAt: Date.now(),
              }
            : todo,
        ),
      )
      setCompletingId(null)
    }, 600)
  }

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id))
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

        {/* Empty State */}
        {todos.length === 0 && (
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
