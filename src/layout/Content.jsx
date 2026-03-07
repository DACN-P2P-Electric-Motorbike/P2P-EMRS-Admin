import ContentTop from '../components/ContentTop/ContentTop';
import ContentMain from '../components/ContentMain/ContentMain';

const Content = () => {
  return (
    <div className='flex-1 p-10 max-[1400px]:px-6 max-[1200px]:px-5 transition-all overflow-y-auto bg-secondary'>
      <ContentTop />
      <ContentMain />
    </div>
  )
}
export default Content;