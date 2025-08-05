export interface Reset {
  id?: number
  email: string
  token: string
  creation_date: Date
}

export interface User {
  id: number
  username: string
  email: string
  password?: string
  creation_data: Date
  last_login_date?: Date
  status?: string
  googleId?: string
  token?: string
  avatar?: string
}

export interface Role {
  id: number
  name: string
}

export interface MemberRole {
  id: number
  member_id: number
  role_id: number
  band_id: number
}

export interface Band {
  id: number
  name: string
  description: string
  setlist: [Setlist]
  members: [BandMember]
  songs: [Song]
}

export interface BandMember {
  id: number
  user_id: number
  band_id: number
  role: string
  roles: [Role]
}

export interface Song {
  id: number
  name: string
  artist: string
  duration: number
  link: string
}

export interface Setlist {
  id: number
  band_id: number
  primary: boolean
  songs: [Song]
}

export interface SetlistSong {
  id: number
  setlist_id: number
  song_id: number
}

export interface Event {
  id: number
  name: string
  band_id: number
  band: Band
  setlist_id: number
  setlist: Setlist
  venue_id: number
  venue: Venue
  vanue_name: string
  members: BandMember
  address: string
  datetime: Date
  poster: string
}

export interface Venue {
  id: number
  name: string
  address: string
  website?: string
}

export interface MemberEvent {
  id: number
  member_id: number
  event_id: number
}