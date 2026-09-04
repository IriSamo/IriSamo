import { writeFileSync } from 'node:fs';

const username = process.env.GITHUB_USERNAME;
const token = process.env.GITHUB_TOKEN;

if (!username || !token) {
    throw new Error('GITHUB_USERNAME and GITHUB_TOKEN are required');
}

const headers = {
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    Accept: 'application/vnd.github+json',
};

async function github(path) {
    const response = await fetch(`https://api.github.com${path}`, { headers });

    if (!response.ok) {
        throw new Error(
            `GitHub API error ${response.status}: ${await response.text()}`
        );
    }

    return response.json();
}

async function getStats() {
    const repos = await github(
        `/users/${username}/repos?per_page=100&type=owner`
    );

    let commits = 0;
    let pullRequests = 0;
    let issues = 0;

    for (const repo of repos) {
        if (repo.fork) continue;

        try {
            const commitsData = await github(
                `/repos/${username}/${repo.name}/commits?author=${username}&per_page=1`
            );

            commits += Number(
                commitsData.length ? commitsData[0]?.sha ? 1 : 0 : 0
            );

            const pulls = await github(
                `/repos/${username}/${repo.name}/pulls?state=all&per_page=100`
            );

            pullRequests += pulls.filter(
                pull => pull.user?.login?.toLowerCase() === username.toLowerCase()
            ).length;

            const repoIssues = await github(
                `/repos/${username}/${repo.name}/issues?state=all&per_page=100`
            );

            issues += repoIssues.filter(
                issue =>
                    !issue.pull_request &&
                    issue.user?.login?.toLowerCase() === username.toLowerCase()
            ).length;
        } catch (error) {
            console.warn(`Skipping ${repo.name}: ${error.message}`);
        }
    }

    return {
        repositories: repos.filter(repo => !repo.fork).length,
        commits,
        pullRequests,
        issues,
    };
}

function createSvg(stats) {
    return `
<svg width="900" height="180" viewBox="0 0 900 180"
     xmlns="http://www.w3.org/2000/svg">

  <rect width="900" height="180" rx="12" fill="#161b22"/>

  <text x="40" y="42"
        font-family="Arial, sans-serif"
        font-size="20"
        font-weight="600"
        fill="#f0f6fc">
    GitHub Activity
  </text>

  <text x="40" y="68"
        font-family="Arial, sans-serif"
        font-size="13"
        fill="#8b949e">
    Open-source activity across my repositories
  </text>

  <g font-family="Arial, sans-serif">

    <text x="80" y="112"
          font-size="26"
          font-weight="700"
          fill="#f0f6fc">
      ${stats.repositories}
    </text>

    <text x="80" y="137"
          font-size="12"
          fill="#8b949e">
      Repositories
    </text>

    <text x="300" y="112"
          font-size="26"
          font-weight="700"
          fill="#f0f6fc">
      ${stats.commits}
    </text>

    <text x="300" y="137"
          font-size="12"
          fill="#8b949e">
      Commits
    </text>

    <text x="520" y="112"
          font-size="26"
          font-weight="700"
          fill="#f0f6fc">
      ${stats.pullRequests}
    </text>

    <text x="520" y="137"
          font-size="12"
          fill="#8b949e">
      Pull Requests
    </text>

    <text x="720" y="112"
          font-size="26"
          font-weight="700"
          fill="#f0f6fc">
      ${stats.issues}
    </text>

    <text x="720" y="137"
          font-size="12"
          fill="#8b949e">
      Issues
    </text>

  </g>
</svg>
`;
}

const stats = await getStats();

writeFileSync(
    'dist/stats.svg',
    createSvg(stats).trim()
);

console.log('Generated dist/stats.svg');
console.log(stats);
