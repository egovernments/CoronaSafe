import React, { useEffect, useState } from 'react';
import { Grid } from '@material-ui/core/';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
    root: {
        backgroundColor: 'white',
        width: '65px',
        height: '28px',
    },
    select: {
        backgroundColor: 'white',
        border: '1px solid #B3ADAC',
    },
    selectMenu: {
        padding: '0',
        paddingTop: '8px',
        paddingRight: '12px',
        textAlign: 'center'
    }
});

const Pagination = (props :any) => {

    const classes = useStyles();
    const { data, onChange } = props;
    const [ rowsPerPage, setRowsPerPage ] = useState(3);
    const [ currentPage, setCurrentPage ] = useState(1);

    useEffect(()=>{
        if(props.defaultPerPage){
            setRowsPerPage(props.defaultPerPage);
        }
        if(props.cPage){
            setCurrentPage(props.cPage);
        }
    },[props]);

    const getPageNumbers = () => {
        const totalPage = Math.ceil(data.totalCount / rowsPerPage);
        const pageNumbers = [];

        if (totalPage === 0) {
            return [1];
        }

        if (currentPage === 1 && currentPage === totalPage) {
            pageNumbers.push(currentPage);
        } else if (currentPage === totalPage) {
            let tempPage = currentPage;
            let pageLimit = 3;
            while (tempPage >= 1 && pageLimit > 0) {
                pageNumbers.push(tempPage);
                tempPage--;
                pageLimit--;
            }
        } else {
            pageNumbers.push(currentPage);
            if (currentPage > 1) {
                pageNumbers.push(currentPage - 1);
                if (currentPage + 1 <= totalPage) {
                    pageNumbers.push(currentPage + 1);
                }
            } else {
                pageNumbers.push(currentPage + 1);
                if (currentPage + 2 <= totalPage) {
                    pageNumbers.push(currentPage + 2);
                }
            }
        }
        return pageNumbers.sort((a, b) => a - b);
    }


    const handleChangePage = (evt: any, action: any) => {
        
        let newPage = 1;
        const totalPage = Math.ceil(data.totalCount / rowsPerPage);

        switch (action) {
        case 'prev':
            newPage = currentPage - 1;
            break;

        case 'next':
            newPage = currentPage + 1;
            break;

        case 'last':
            newPage = totalPage;
            break;

        default:
            break;
        }

        setCurrentPage(newPage);
        onChange(newPage, rowsPerPage);
    }

    const goToPage = (e: any, page: any) => {
        setCurrentPage(page);
        onChange(page, rowsPerPage);
    }

    const renderNavigationBtn = (label:any, disabled: any) => {
        return (
                <span
                    onClick={e => (disabled ? false : handleChangePage(e, label.toLowerCase()))}
                    className={`w3-button ${!disabled ? 'cursor-pointer' : 'non-clickable w3-disabled'}`}>
                    {label}
                </span>
        );
    }

        const totalCount = data.totalCount;
        if (!totalCount) {
            return null;
        }
        const totalPage = Math.ceil(totalCount / rowsPerPage);
        const pageNumbers = getPageNumbers();
        const firstBtnDisable = currentPage === 1;
        const prevBtnDisable = currentPage - 1 <= 1;
        const nextBtnDisable = currentPage + 1 >= totalPage;
        const lastBtnDisable = totalPage === 0 || currentPage === totalPage;

        return (
            <Grid container className="pagination w3-margin-top" >
                <Grid item xs={12} md={12}>
                    <div className="w3-bar w3-border w3-round w3-white">
                        {renderNavigationBtn('First', firstBtnDisable)}
                        {renderNavigationBtn('Prev', prevBtnDisable)}
                                {pageNumbers.map(pageNo => (
                                    <span
                                        key={`page_${pageNo}`}
                                        className={`w3-button cursor-pointer ${currentPage === pageNo ? 'current-page' : 'page-no'}`}
                                        onClick={e => goToPage(e, pageNo)}
                                    >
                                        {pageNo}
                                    </span>
                                ))}
                        {renderNavigationBtn('Next', nextBtnDisable)}
                        {renderNavigationBtn('Last', lastBtnDisable)}
                    </div>
                </Grid>
            </Grid>
        );
}

export default Pagination;