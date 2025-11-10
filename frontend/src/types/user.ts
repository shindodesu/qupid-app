export type User = {
  id: number
  email: string
  display_name: string
  bio?: string
  avatar_url?: string
  campus?: string
  faculty?: string
  grade?: string
  birthday?: string
  gender?: string
  sexuality?: string
  looking_for?: string
  profile_completed?: boolean
  is_active?: boolean
  created_at?: string
  updated_at?: string
  
  // プライバシー設定
  show_faculty?: boolean
  show_grade?: boolean
  show_birthday?: boolean
  show_age?: boolean
  show_gender?: boolean
  show_sexuality?: boolean
  show_looking_for?: boolean
  show_bio?: boolean
  show_tags?: boolean
}

export type InitialProfileData = {
  display_name: string
  gender: string
  sexuality: string
  looking_for: string
}

export type UserUpdate = Partial<Pick<User, 'display_name' | 'bio' | 'campus' | 'faculty' | 'grade' | 'birthday' | 'gender' | 'sexuality' | 'looking_for'>>

export type LoginPayload = { 
  email: string
  password: string 
}

export type PrivacySettings = {
  show_faculty?: boolean
  show_grade?: boolean
  show_birthday?: boolean
  show_age?: boolean
  show_gender?: boolean
  show_sexuality?: boolean
  show_looking_for?: boolean
  show_bio?: boolean
  show_tags?: boolean
}
