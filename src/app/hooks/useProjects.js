import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useProjects(userId) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    fetchProjects()
  }, [userId])

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: true })
    if (!error) setProjects(data || [])
    setLoading(false)
  }

  const addProject = async (project) => {
    const { data, error } = await supabase
      .from('projects')
      .insert([{ ...project, user_id: userId }])
      .select()
      .single()
    if (!error) setProjects(p => [...p, data])
    return { data, error }
  }

  const updateProject = async (id, updates) => {
    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
    if (!error) setProjects(p => p.map(pr => pr.id === id ? { ...pr, ...updates } : pr))
  }

  const deleteProject = async (id) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
    if (!error) setProjects(p => p.filter(pr => pr.id !== id))
  }

  return { projects, loading, addProject, updateProject, deleteProject, refetch: fetchProjects }
}
