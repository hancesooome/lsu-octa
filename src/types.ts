export interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'librarian';
  id_number?: string;
}

export interface Collaborator {
  id_number: string;
  name: string;
  user_id?: number;
}

export interface CollaborationRequest {
  id: number;
  thesis_id: number;
  collaborator_user_id: number;
  requester_user_id: number;
  status: 'pending' | 'accepted' | 'declined';
  created_at?: string;
  thesis?: { id: number; title: string; author: string; year: number };
  requester?: { id: number; name: string };
}

export interface Thesis {
  id: number;
  title: string;
  author: string;
  year: number;
  college: string;
  summary: string;
  cover_image_url: string;
  pdf_url: string;
  awardee: boolean;
  featured: boolean;
  status: 'pending' | 'approved' | 'rejected';
  submitted_by: number;
  approval_date?: string;
  collaborators?: { id_number: string; name: string }[];
}

export const COLLEGES = [
  {
    name: "College of Arts and Sciences",
    abbreviation: "CAS",
    logo: "https://lsu-media-styles.sgp1.digitaloceanspaces.com/lsu-public-images/banners/logo/colleges/cas.png"
  },
  {
    name: "College of Business and Accountancy",
    abbreviation: "CBA",
    logo: "https://lsu-media-styles.sgp1.digitaloceanspaces.com/lsu-public-images/banners/logo/colleges/cba.png"
  },
  {
    name: "College of Criminal Justice Education",
    abbreviation: "CCJE",
    logo: "https://lsu-media-styles.sgp1.digitaloceanspaces.com/lsu-public-images/banners/logo/colleges/ccje.jpg"
  },
  {
    name: "College of Computer Studies, Engineering, and Architecture",
    abbreviation: "CCSEA",
    logo: "https://lsu-media-styles.sgp1.digitaloceanspaces.com/lsu-public-images/banners/logo/colleges/ccsea.png"
  },
  {
    name: "College of Nursing",
    abbreviation: "CON",
    logo: "https://lsu-media-styles.sgp1.digitaloceanspaces.com/lsu-public-images/banners/logo/colleges/con-lsu.png"
  },
  {
    name: "College of Teacher Education",
    abbreviation: "CTE",
    logo: "https://lsu-media-styles.sgp1.digitaloceanspaces.com/lsu-public-images/banners/logo/colleges/cte.png"
  },
  {
    name: "College of Tourism and Hospitality Management",
    abbreviation: "CTHM",
    logo: "https://lsu-media-styles.sgp1.digitaloceanspaces.com/lsu-public-images/banners/logo/colleges/cthm.png"
  }
];
