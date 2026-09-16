import '../styles/filterscatalogue.css';
import IdFilter from "./IdFilter";
import { petImageSrc } from "../services/petImage";
const FiltersCatalogue = ({ data, defaultData, setCatalogueData, selectedPetShop }: any) => {

    return (
        <aside>

            <div className='petshop-info'>
                <span id='selected-pet' className='filters-title'>Selected Pet</span>
                <div className='selected-petshop-info'>
                    <span><i>Name: </i>{selectedPetShop.name}</span>
                    <span><i>Id: </i>{selectedPetShop.id}</span>
                    <span><i>Animal: </i>{selectedPetShop.animal}</span>
                </div>
                <div className='petshop-image'>
                    <img src={petImageSrc(selectedPetShop.id)} alt="" />
                </div>
            </div>

            <span className='filters-title'>Filters</span>
            <IdFilter setPetShopData={setCatalogueData} defaultData={defaultData} />

        </aside>
    );
}

export default FiltersCatalogue;