import { supabase } from './supabase'

export interface AssessmentRecord {
  id: string
  respondent_name: string
  respondent_role: string | null
  respondent_email: string
  organization_name: string
  answers: Record<string, number>
  scores: ScoreData[]
  analysis: AnalysisData
  created_at: string
}

interface ScoreData {
  pillar: string
  color: string
  score: number
  dimensions: Array<{ title: string; score: number }>
}

interface AnalysisData {
  summary: string
  strengths: string[]
  priorities: string[]
  closing: string
}

export async function saveAssessment(data: {
  respondent_name: string
  respondent_role?: string
  respondent_email: string
  organization_name: string
  answers: Record<string, number>
  scores: ScoreData[]
  analysis: AnalysisData
}): Promise<string> {
  const { data: result, error } = await supabase
    .from('assessments')
    .insert({
      respondent_name: data.respondent_name,
      respondent_role: data.respondent_role ?? null,
      respondent_email: data.respondent_email,
      organization_name: data.organization_name,
      answers: data.answers,
      scores: data.scores,
      analysis: data.analysis,
    })
    .select('id')
    .single()

  if (error) throw error
  return result.id
}

export async function getAssessment(id: string): Promise<AssessmentRecord | null> {
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data
}
