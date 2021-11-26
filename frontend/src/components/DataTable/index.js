import React, { useState, useEffect } from 'react';

const DataTable = (props) => {
    return (
        <table>
            <tr>
                {props.keys.map((key, index) => {
                    return <th key={index}>{key}</th>
                })}
            </tr>
            {props.result.map((row, index) => {
                return (
                    <tr key={index}>
                        {props.keys.map((key, index) => {
                            return <td key={index}>{row[key]}</td>
                        })}
                    </tr>
                )
            })}
        </table>
    );
}

export default DataTable;