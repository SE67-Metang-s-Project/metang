'use client';

import React, { useState } from 'react';
import SideNav from '@/components/SidebarNav';
import UserProfile from '@/components/UserProfile';
import { Menu, Search, FileText, ChevronDown, ArrowRight, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
    const [isSideNavOpen, setIsSideNavOpen] = useState(false);
}