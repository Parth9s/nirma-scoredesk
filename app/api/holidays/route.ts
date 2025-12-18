import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const holidays = await prisma.holiday.findMany({
            orderBy: {
                date: 'asc'
            }
        });
        return NextResponse.json(holidays);
    } catch (error) {
        console.error('Failed to fetch holidays:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, date, isFloating } = body;

        if (!name || !date) {
            return NextResponse.json({ error: 'Name and Date are required' }, { status: 400 });
        }

        const holiday = await prisma.holiday.create({
            data: {
                name,
                date: new Date(date),
                isFloating: isFloating || false
            }
        });

        return NextResponse.json(holiday);
    } catch (error) {
        console.error('Failed to create holiday:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
