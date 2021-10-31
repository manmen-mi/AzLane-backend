const groupName = "shouga";
let startId = 21;

interface Article {jp: string, ko: ''}

interface Post {
    pid: number,
    name: string,
    article: Article,
    comments: Comment[]
}

interface Comment {
    depth: number,
    name: string,
    comment: Article
}

const basePost: Post = {
    pid: 0,
    name: "",
    article: {jp: "", ko: ""},
    comments: []
}

const baseComment: Comment = {
    depth: 0,
    name: "",
    comment: {jp: "", ko: ""}
}

const file = await Deno.readTextFile(`conv/source.txt`);
const source = file.split('\n');
console.log('lines > ' + source.length);

const ignoreLine = [
    "|150|70|500|c",
    "||CENTER:60|CENTER:60||c",
    "|~|>|>| |",
    "#region",
];
const filtered = source.filter(l => l.length && !ignoreLine.includes(l))
console.log('filtered > ' + filtered.length);

const postRegex = /\|CENTER:&attachref\(img\/(?<kanji>.+)(_icon|_icon2)?\.jpg,nolink,50x50\);&br;(?<id>.+)\|&attachref\(.*\.jpg,nolink,70x70\);\|''(?<article>.+) ''\|/;
const commentRegex = /&attachref\(img\/(?<kanji>.+)(_icon|_icon2)?\.jpg,nolink,50x50\);\|(?<id>.+)\.(?<comment>.+)\|/;
const commanderRegex = /\|~\|指揮官\|>\|(?<comment>.+)\|/;

const foundKanji: Record<string, string> = {};
const postGroup: Record<number, Post> = {};
let currentPost: Post | null = null;
filtered.forEach(line => {
    if (postRegex.test(line)) {
        const matched = postRegex.exec(line);

        if (!matched?.groups?.kanji || !matched?.groups.id) return console.log('regex error');

        const kanji = matched.groups.kanji;
        const id = matched.groups.id;

        foundKanji[kanji] = id;

        currentPost = JSON.parse(JSON.stringify(basePost)) as typeof basePost;
        currentPost.pid = startId++;
        currentPost.name = kanji;
        currentPost.article.jp = matched.groups.article;
    } else if (line === '#endregion') {
        if (currentPost) postGroup[currentPost.pid] = currentPost;
        currentPost = null;
    } else if (commentRegex.test(line)) {
        const matched = commentRegex.exec(line);

        if (!matched?.groups?.kanji || !matched?.groups.id) return console.log('regex error');

        const kanji = matched.groups.kanji;
        const id = matched.groups.id;

        foundKanji[kanji] = id;

        const comment = JSON.parse(JSON.stringify(baseComment)) as Comment;
        comment.depth = /\|~\|(~|\s)\|/.test(line) ? 1 : 0;
        comment.name = kanji;
        comment.comment.jp = matched.groups.comment;

        currentPost?.comments.push(comment);
    } else if (commanderRegex.test(line)) {
        const matched = commanderRegex.exec(line);

        const comment = JSON.parse(JSON.stringify(baseComment)) as Comment;
        comment.name = 'commander';
        comment.comment.jp = matched?.groups?.comment ?? 'regex_error';

        currentPost?.comments.push(comment);
    }
});

await Deno.writeTextFile(`conv/${groupName}_kanji.json`, JSON.stringify(foundKanji, null, 4));
await Deno.writeTextFile(`conv/${groupName}.json`, JSON.stringify(postGroup, null, 4));