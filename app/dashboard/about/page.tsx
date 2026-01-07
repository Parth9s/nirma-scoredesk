'use client';

import { Mail, Github, Linkedin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
    return (
        <div className="min-h-full w-full bg-white/50">
            {/* Hero Section */}
            <div className="relative py-20 px-6 text-center border-b border-gray-100 bg-white">
                <div className="max-w-3xl mx-auto space-y-6">
                    <h1 className="text-5xl font-bold tracking-tight text-slate-900 font-logo">
                        We are <span className="text-blue-600 great-vibes-regular">Stride</span>
                    </h1>
                    <p className="text-xl text-gray-500 leading-relaxed font-light">
                        Redefining the academic experience for the modern student.
                        <br />
                        Simple, elegant, and powerful.
                    </p>
                </div>
            </div>

            {/* Mission Section */}
            <div className="py-20 px-6">
                <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <div className="h-1 w-20 bg-blue-600 rounded-full"></div>
                        <h2 className="text-3xl font-bold text-slate-900">Our Philosophy</h2>
                        <p className="text-gray-600 leading-relaxed text-lg">
                            Academic life shouldn't be chaotic. We believe in the power of clarity.
                            Stride was born from a desire to strip away the noise and provide a focused,
                            beautiful dashboard that puts your grades, attendance, and resources front and center.
                        </p>
                    </div>
                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Why Stride?</h3>
                        <ul className="space-y-3 text-gray-600">
                            <li className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                                Attendance tracking made effortless
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                                Precision SGPA & CGPA calculators
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                                Curated academic resources
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                                Privacy-first architecture
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Developer/Contact Section - Minimal */}
            <div className="bg-slate-900 py-20 px-6 text-white">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-semibold">Crafted by Parth Savaliya</h2>
                        <p className="text-slate-400">Full Stack Developer & Student</p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-6">
                        <Button
                            variant="outline"
                            className="bg-transparent text-white border-white hover:bg-white hover:text-slate-900 transition-colors duration-300 gap-2"
                            asChild
                        >
                            <a href="mailto:parthsavaliya1111@gmail.com">
                                <Mail className="h-4 w-4" />
                                Get in Touch
                            </a>
                        </Button>

                        <Button
                            variant="ghost"
                            className="text-slate-300 hover:text-white hover:bg-white/5 gap-2"
                            asChild
                        >
                            <a href="https://linkedin.com/in/parth-savaliya-33398723a" target="_blank" rel="noopener noreferrer">
                                <Linkedin className="h-4 w-4" />
                                LinkedIn
                            </a>
                        </Button>

                        <Button
                            variant="ghost"
                            className="text-slate-300 hover:text-white hover:bg-white/5 gap-2"
                            asChild
                        >
                            <a href="https://github.com/Parth9s" target="_blank" rel="noopener noreferrer">
                                <Github className="h-4 w-4" />
                                GitHub
                            </a>
                        </Button>
                    </div>

                    <div className="pt-12 border-t border-white/10">
                        <p className="text-sm text-slate-500">
                            © {new Date().getFullYear()} Stride. Made for the Student Community.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
