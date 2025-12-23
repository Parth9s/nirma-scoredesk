async function fetchSubjects() {
    try {
        const response = await fetch('https://nirma-scoredesk.vercel.app/api/subjects');
        const data = await response.json();

        const targetBranch = 'Electronics and Instrumentation Engineering';

        const relevantSubjects = data.filter(s =>
            s.semester && s.semester.branch && s.semester.branch.name === targetBranch
        );

        console.log(`Found ${relevantSubjects.length} subjects for ${targetBranch}:`);
        relevantSubjects.forEach(s => {
            console.log(`- [Sem ${s.semester.number}] ${s.name} (${s.code}) - Credits: ${s.credits}`);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

fetchSubjects();
