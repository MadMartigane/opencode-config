import fetch from 'node-fetch';

interface Comment {
  id: number;
  text: string;
  author: { displayName: string; name?: string };
  createdDate: number;
  updatedDate?: number;
  anchor?: { path?: string; line?: number; lineType?: string };
  parent?: { id: number }; // pour les replies
}

interface Activity {
  action: string;
  comment?: Comment;
  user: { displayName: string };
}

interface ApiResponse {
  values: Activity[];
  size: number;
  isLastPage: boolean;
  nextPageStart?: number;
}

const BASE_URL = process.env.BITBUCKET_URL || 'https://bitbucket.mon-entreprise.com'; // ← change ici
const USERNAME = process.env.BITBUCKET_USER; // ton username ou email
const TOKEN = process.env.BITBUCKET_TOKEN;   // Personal Access Token ou HTTP access token (recommandé)

async function fetchPRComments(
  projectKey: string,
  repoSlug: string,
  prId: number | string,
  limit: number = 200
): Promise<Comment[]> {
  if (!USERNAME || !TOKEN) {
    throw new Error('Variables d\'environnement BITBUCKET_USER et BITBUCKET_TOKEN manquantes');
  }

  const auth = Buffer.from(`${USERNAME}:${TOKEN}`).toString('base64');
  const headers = {
    'Authorization': `Basic ${auth}`,
    'Accept': 'application/json',
  };

  let comments: Comment[] = [];
  let start = 0;
  let hasMore = true;

  while (hasMore && comments.length < limit) {
    const url = `${BASE_URL}/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/pull-requests/${prId}/activities?limit=100&start=${start}`;

    const res = await fetch(url, { headers });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erreur API ${res.status}: ${errorText}`);
    }

    const data: ApiResponse = await res.json();

    // Filtrer uniquement les COMMENTED et extraire le comment
    const pageComments = data.values
      .filter((act) => act.action === 'COMMENTED' && act.comment)
      .map((act) => act.comment!);

    comments = comments.concat(pageComments);

    hasMore = !data.isLastPage;
    start = (data.nextPageStart ?? start + data.size);
  }

  // Tronquer au limit demandé (au cas où)
  return comments.slice(0, limit);
}

function formatComment(c: Comment): string {
  const date = new Date(c.createdDate).toLocaleString('fr-FR');
  const author = c.author.displayName || c.author.name || 'Anonyme';
  const path = c.anchor?.path ? `→ ${c.anchor.path}` : '';
  const line = c.anchor?.line ? ` (ligne ${c.anchor.line})` : '';

  let replyPrefix = '';
  if (c.parent) {
    replyPrefix = '  ↳ ';
  }

  return `${replyPrefix}**${author}** (${date})${path}${line}:\n${c.text}\n`;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log('Usage:');
    console.log('  ts-node fetch-pr-comments.ts <projectKey> <repoSlug> <prId> [limit]');
    console.log('Exemple:');
    console.log('  ts-node fetch-pr-comments.ts MONPROJET mon-repo 123 50');
    process.exit(1);
  }

  const projectKey = args[0];
  const repoSlug = args[1];
  const prId = parseInt(args[2], 10);
  const limit = args[3] ? parseInt(args[3], 10) : 200;

  try {
    const comments = await fetchPRComments(projectKey, repoSlug, prId, limit);

    if (comments.length === 0) {
      console.log('Aucun commentaire trouvé sur cette PR.');
      return;
    }

    console.log(`=== Commentaires de la PR ${prId} (${comments.length} trouvés) ===\n`);

    comments.forEach((c) => {
      console.log(formatComment(c));
      console.log('─'.repeat(60));
    });

  } catch (err: any) {
    console.error('Erreur:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

