import { GetStaticProps, InferGetStaticPropsType } from 'next'
import Head from 'next/head'
import Layout from '../../components/Layout'
import NotionService from '../../services/notion-service'
import rehypeStringify from 'rehype-stringify/lib'
import remarkRehype from 'remark-rehype/lib'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse/lib'
import { unified } from 'unified'
import Image from 'next/image'

const Post = ({ markdown, post }: InferGetStaticPropsType<typeof getStaticProps>) => {
  console.log(post)
  return (
    <>
      <Head>
        <title>WISE TECH</title>
        <meta name={'description'} title={'description'} content={post.description} />
        <meta name={'og:title'} title={'og:title'} content={post.title} />
        <meta name={'og:description'} title={'og:description'} content={post.description} />
        <meta name={'og:image'} title={'og:image'} content={post?.cover} />
      </Head>

      <Layout>
        <div className="min-h-screen my-10">
          <main className="max-w-5xl mx-auto relative">
            <h1 className="text-4xl font-bold flex items-center justify-center mb-10">{post.title}</h1>
            <h4 className="text-s text-center font-medium text-gray-400">{post.date.substr(0, 10)}</h4>
            <div className="text-center rounded-xl">
              <Image objectFit="cover" src={post.cover} alt="" width={820} height={600} />
            </div>
            <div className=" text-center bg-slate-200 w-[80%] h-28 rounded-xl mx-auto mb-32 p-10">{post.description}</div>
            <div className="flex items-center justify-center">
              <article className="prose" dangerouslySetInnerHTML={{ __html: markdown }}></article>
            </div>
            <span className="block ml-24 mt-32 space-x-4">
              {post?.tags.map((tag: any) => (
                <span key={tag.id} className="bg-blue-500 text-white px-2 py-1 text-xs rounded-lg">
                  #{tag.name}
                </span>
              ))}
            </span>
          </main>
        </div>
      </Layout>
    </>
  )
}

export const getStaticProps: GetStaticProps = async (context) => {
  const notionService = new NotionService()
  // @ts-ignore
  const p = await notionService.getSingleBlogPost(context.params?.slug)
  if (!p) {
    throw ''
  }
  const load = await unified()
    .use(remarkParse) // markdown을 mdast로 변환
    .use(remarkGfm) // remark가 GFM도 지원 가능하도록
    .use(remarkBreaks) // remark가 line-break도 지원 가능하도록
    .use(remarkRehype, { allowDangerousHtml: true }) // mdast를 hast로 변환
    .use(rehypeStringify, { allowDangerousHtml: true }) // hast를 html 변환
    .process(p.markdown)
  return {
    props: {
      markdown: load.value,
      post: p.post,
    },
  }
}

export async function getStaticPaths() {
  const notionService = new NotionService()

  const posts = await notionService.getPublishedBlogPosts()

  const paths = posts.map((post) => {
    return `/post/${post.slug}`
  })

  return {
    paths,
    fallback: false,
  }
}

export default Post
