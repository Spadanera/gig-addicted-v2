import { RowDataPacket } from "mysql2"

export interface Reset {
  id?: number
  email: string
  token: string
  creation_date: Date
}

export interface Invitation extends User {
  
}

export interface Repository extends RowDataPacket {

}

export interface User extends Repository {
  id?: number
  username?: string
  email: string
  password?: string
  creation_date?: string
  last_login_date?: Date
  status?: string
  googleId?: string
  token?: string
  avatar?: string
}

export interface Role extends Repository {
  id: number
  name: string
}

export interface MemberRole extends Repository {
  id: number
  member_id: number
  role_id: number
  band_id: number
}

export interface Band extends Repository {
  id?: number
  name?: string
  description?: string
  logo?: string
  isPublic?: boolean
  setlist?: [Setlist]
  members?: [BandMember]
  songs?: [Song]
}

export interface BandMember extends Repository {
  id: number
  user_id: number
  band_id: number
  role: string
  roles: [Role]
}

export interface Song extends Repository {
  id: number
  name: string
  artist: string
  duration: number
  link: string
}

export interface Setlist extends Repository {
  id: number
  band_id: number
  primary: boolean
  isPublic: boolean
  songs: [Song]
}

export interface SetlistSong extends Repository {
  id: number
  setlist_id: number
  song_id: number
}

export interface Event extends Repository {
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

export interface Venue extends Repository {
  id: number
  name: string
  address: string
  website?: string
}

export interface MemberEvent extends Repository {
  id: number
  member_id: number
  event_id: number
}